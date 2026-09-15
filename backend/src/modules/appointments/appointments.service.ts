import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import Appointment from 'src/entities/appointment.entity';
import {
  DataSource,
  EntityManager,
  Equal,
  In,
  MoreThanOrEqual,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { BodyCreateAppointmentDto } from './dto/request/bodyCreateAppointment.dto';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { dayNumberToEnum } from 'src/shared/enums/dayOfWeek';
import { BodyPersonalAppointmentsDto } from './dto/request/bodyPersonalAppointments.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { UsersService } from '../users/users.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { RelativesService } from '../relatives/relatives.service';
import { SpecialtiesService } from '../specialties/specialties.service';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { AppointmentsMapper } from './appointments.mapper';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import { isPgDriverError } from '../../utils/isPgDriverError';
import { toHHMM, toMinutes } from '../../utils/toMinutes';
import Relative from '../../entities/relative.entity';
import { AppointmentResponseDto } from './dto/response/appointmentResponse.dto';
import { BodyFilterImproveDto } from './dto/request/bodyFilterImprove.dto';
import { BodyCreateRelativeDto } from '../relatives/dto/request/bodyCreateRelative.dto';
import {
  AppointmentNotificationContext,
  NotificationsService,
} from '../notifications/notifications.service';
import { NotificationType } from 'src/shared/enums/notificationType';
import { SettingsService } from '../settings/settings.service';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { RoleName } from 'src/shared/enums/roleName';

export const APPOINTMENT_SLOT_UNAVAILABLE = 'APPOINTMENT_SLOT_UNAVAILABLE';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly doctorSchedulesService: DoctorSchedulesService,
    private readonly relativesService: RelativesService,
    private readonly specialtiesService: SpecialtiesService,
    private readonly redisCacheService: RedisCacheService,
    private readonly dataSource: DataSource,
    private readonly gateway: WebsocketGateway,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
    private readonly emailProducer: EmailProducer,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendAppointmentReminders() {
    const now = new Date();
    const reminderBeforeMinutes =
      await this.settingsService.getAppointmentReminderBeforeMinutes();
    const reminderLimit = new Date(
      now.getTime() + reminderBeforeMinutes * 60 * 1000,
    );
    const today = this.formatDateOnly(now);
    const lastDate = this.formatDateOnly(reminderLimit);
    const appointments = await this.baseAppointmentQuery()
      .where('appointment.status = :status', {
        status: AppointmentStatus.CONFIRMED,
      })
      .andWhere('appointment.appointment_date BETWEEN :today AND :lastDate', {
        today,
        lastDate,
      })
      .getMany();

    await Promise.all(
      appointments.map(async (appointment) => {
        const scheduledAt = this.buildAppointmentStartDate(appointment);
        if (scheduledAt <= now || scheduledAt > reminderLimit) return;
        const context =
          await this.toAppointmentNotificationContext(appointment);
        if (!context) return;
        if (
          !(await this.settingsService.shouldSendAppointmentReminder(
            context.patientUserId,
          ))
        ) {
          return;
        }

        try {
          const [notification] =
            await this.notificationsService.createAppointmentReminder(context);
          if (notification) {
            await this.enqueueAppointmentEmailSafely(
              notification.id,
              context,
              notification.title,
              notification.content,
            );
          }
        } catch (error) {
          this.logger.error(
            `Không thể nhắc lịch hẹn #${appointment.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }),
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async markExpiredPendingAppointments() {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const pendingAppointments = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule')
      .leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser')
      .where('appointment.status = :status', {
        status: AppointmentStatus.PENDING,
      })
      .andWhere('appointment.appointment_date <= :today', { today })
      .getMany();

    const expiredAppointmentIds = pendingAppointments
      .filter((appointment) => this.buildAppointmentEndDate(appointment) < now)
      .map((appointment) => appointment.id);

    if (expiredAppointmentIds.length === 0) {
      return;
    }

    const result = await this.appointmentRepo
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: AppointmentStatus.EXPIRED })
      .whereInIds(expiredAppointmentIds)
      .andWhere('status = :status', {
        status: AppointmentStatus.PENDING,
      })
      .returning('id')
      .execute();

    const updatedAppointmentIds = (
      result.raw as Array<{ id: number | string }>
    ).map(({ id }) => Number(id));
    if (updatedAppointmentIds.length === 0) {
      return;
    }
    const updatedAppointmentIdSet = new Set(updatedAppointmentIds);
    const updatedAppointments = pendingAppointments.filter((appointment) =>
      updatedAppointmentIdSet.has(appointment.id),
    );

    await this.redisCacheService.delByPrefix('appointments:');
    await Promise.all(
      updatedAppointments.map((appointment) =>
        this.redisCacheService.delData(
          `user:${appointment.booked_by_user.id}:appointment:${appointment.id}`,
        ),
      ),
    );

    // pendingAppointments chỉ join doctor_schedule/booked_by_user (đủ cho việc
    // lọc quá hạn ở trên), không đủ join cho notification (cần patient.user,
    // doctor_schedule.doctor.user...). Nạp lại 1 lần duy nhất cho toàn bộ
    // appointmentId vừa hết hạn, thay vì để mỗi notification tự query lại
    // từng appointment riêng lẻ (N+1 trên cron chạy mỗi phút).
    const expiredAppointmentsWithDetails = await this.baseAppointmentQuery()
      .where('appointment.id IN (:...ids)', { ids: updatedAppointmentIds })
      .getMany();
    await Promise.all(
      expiredAppointmentsWithDetails.map((appointment) =>
        this.createAppointmentNotificationSafely(
          NotificationType.APPOINTMENT_EXPIRED,
          appointment,
        ),
      ),
    );
  }

  async createWithNotifications(
    userId: number,
    body: BodyCreateAppointmentDto,
  ) {
    try {
      const newAppointment: AppointmentResponseDto = await this.create(
        userId,
        body,
      );
      this.gateway.notifyBookAppointmentSuccess(userId, newAppointment);
      await this.createAppointmentNotificationSafely(
        NotificationType.APPOINTMENT_CREATED,
        newAppointment.id,
      );
      return newAppointment;
    } catch (error: unknown) {
      let isPgUnique = false;
      if (error instanceof QueryFailedError) {
        const driverError: unknown = error.driverError;
        if (isPgDriverError(driverError)) {
          isPgUnique =
            driverError.code === '23505' &&
            driverError.constraint === 'unique_doctor_schedule_date';
        }
      }
      if (!isPgUnique) {
        this.gateway.notifyBookAppointmentFail(
          userId,
          'Đặt lịch khám đã có lỗi xảy ra !',
        );
        console.log('Error booking appointment:', error);
        throw error;
      }

      this.gateway.notifyBookAppointmentFail(
        userId,
        'Ca này đã có lịch hẹn! Vui lòng chọn ca khác.',
      );
      throw new ConflictException(
        'Ca này đã có lịch hẹn! Vui lòng chọn ca khác.',
      );
    }
  }

  async create(userId: number, body: BodyCreateAppointmentDto) {
    const appointmentDetail = await this.dataSource.transaction(
      async (manager) => {
        const user_booked = await this.usersService.findByUserId(userId);
        if (!user_booked)
          throw new NotFoundException('Không tìm thấy người dùng.');
        const isAdmin = (user_booked.roles ?? []).some(
          (userRole) => userRole.role?.role_name === 'ADMIN',
        );
        const {
          appointment_date,
          relative_id,
          new_relative_profile,
          booking_mode,
          doctor_schedule_id,
          specialty_id,
          start_time,
          end_time,
        } = body;

        const { appointmentDate, appointmentDateOnly } =
          this.assertNotPastDate(appointment_date);

        const patient = await this.resolvePatient(
          manager,
          userId,
          relative_id,
          new_relative_profile,
          isAdmin,
        );

        const appointmentDayOfWeek = dayNumberToEnum[appointmentDate.getDay()];

        let chosenSchedule: DoctorSchedule;
        if (doctor_schedule_id !== undefined && doctor_schedule_id !== null) {
          const found: DoctorSchedule | null = await manager.findOne(
            DoctorSchedule,
            {
              where: {
                id: doctor_schedule_id,
                is_active: true,
              },
            },
          );
          if (!found)
            throw new NotFoundException(
              'Bác sĩ nghỉ hoặc không có làm việc trong ngày bạn yêu cầu !',
            );

          if (found.day_of_week !== appointmentDayOfWeek) {
            throw new BadRequestException(
              'Ca khám không khớp với ngày mà bạn yêu cầu. Vui lòng chọn ca khác.',
            );
          }
          chosenSchedule = found;
        } else {
          chosenSchedule = await this.findAutoSelectSchedule(manager, {
            specialty_id: specialty_id!,
            weekday: appointmentDayOfWeek,
            appointmentDateOnly,
            start_time: start_time!,
            end_time,
          });
        }

        this.assertNotPastTimeSlot(
          appointmentDateOnly,
          chosenSchedule.start_time,
        );

        await this.assertNoPatientConflict(
          manager,
          patient.id,
          appointmentDateOnly,
          chosenSchedule.start_time,
          chosenSchedule.end_time,
        );

        const appointment = manager.create(Appointment, {
          appointment_date: appointmentDate,
          doctor_schedule: chosenSchedule,
          booked_by_user: user_booked,
          patient,
          booking_mode,
        });

        const saved = await manager.save(Appointment, appointment);

        const appointmentDetail = await this.getAppointmentDetailTransaction(
          manager,
          userId,
          saved.id,
        );

        return appointmentDetail;
      },
    );

    const doctorId = appointmentDetail.doctor.id;
    await Promise.all([
      this.redisCacheService.delByPrefix('appointments:'),
      this.redisCacheService.delData(`doctorSchedules:doctor:${doctorId}`),
      this.redisCacheService.delData(`doctor:${doctorId}`),
    ]);

    return appointmentDetail;
  }

  private assertNotPastDate(appointment_date: string): {
    appointmentDate: Date;
    appointmentDateOnly: string;
  } {
    const appointmentDateOnly = appointment_date.slice(0, 10);
    const appointmentDate = new Date(`${appointmentDateOnly}T00:00:00`);
    const now = new Date();
    const appointmentDay = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (appointmentDay < today) {
      throw new BadRequestException(
        'Ngày đặt lịch không được là ngày trong quá khứ.',
      );
    }

    return { appointmentDate, appointmentDateOnly };
  }

  private assertNotPastTimeSlot(
    appointmentDateOnly: string,
    startTime: string,
  ): void {
    const now = new Date();
    if (appointmentDateOnly !== this.formatDateOnly(now)) return;

    if (toMinutes(startTime) <= toMinutes(toHHMM(now))) {
      throw new BadRequestException('Không thể đặt lịch cho khung giờ đã qua.');
    }
  }

  /**
   * relative_id và new_relative_profile là hai nhánh loại trừ lẫn nhau (đã
   * được BodyCreateAppointmentDto validate ở tầng DTO), nên non-null
   * assertion ở nhánh còn lại là an toàn.
   */
  private async resolvePatient(
    manager: EntityManager,
    userId: number,
    relative_id: number | undefined,
    new_relative_profile: BodyCreateRelativeDto | undefined,
    isAdmin: boolean,
  ): Promise<Relative> {
    if (relative_id !== undefined && relative_id !== null) {
      return this.lockAndValidatePatient(manager, userId, relative_id, isAdmin);
    }
    return this.relativesService.findOrCreateForBooking(
      manager,
      userId,
      new_relative_profile!,
    );
  }

  private async lockAndValidatePatient(
    manager: EntityManager,
    userId: number,
    relative_id: number,
    isAdmin: boolean,
  ): Promise<Relative> {
    const patientQuery = manager
      .getRepository(Relative)
      .createQueryBuilder('relative')
      .setLock('pessimistic_write')
      .where('relative.id = :relative_id', { relative_id });
    if (!isAdmin) {
      patientQuery.andWhere('relative.user.id = :userId', { userId });
    }
    const patient = await patientQuery.getOne();
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân.');
    return patient;
  }

  private async assertNoPatientConflict(
    manager: EntityManager,
    patientId: number,
    appointmentDateOnly: string,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const patientConflict = await manager
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoin('appointment.doctor_schedule', 'doctor_schedule')
      .where('appointment.patient.id = :patientId', { patientId })
      .andWhere('DATE(appointment.appointment_date) = :appointmentDate', {
        appointmentDate: appointmentDateOnly,
      })
      .andWhere('doctor_schedule.start_time < :new_end_time', {
        new_end_time: endTime,
      })
      .andWhere('doctor_schedule.end_time > :new_start_time', {
        new_start_time: startTime,
      })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .getOne();

    if (patientConflict) {
      throw new ConflictException(
        'Bệnh nhân đã có lịch hẹn khác vào thời gian này.',
      );
    }
  }

  private async findAutoSelectSchedule(
    manager: EntityManager,
    params: {
      specialty_id: number;
      weekday: DayOfWeek;
      appointmentDateOnly: string;
      start_time: string;
      end_time?: string;
    },
  ): Promise<DoctorSchedule> {
    await this.specialtiesService.findSpecialtyById(params.specialty_id);

    const query = manager
      .getRepository(DoctorSchedule)
      .createQueryBuilder('doctor_schedule')
      .innerJoin('doctor_schedule.doctor', 'doctor')
      .innerJoin('doctor.specialty', 'specialty')
      .setLock('pessimistic_write', undefined, ['doctor_schedule'])
      .where('doctor_schedule.is_active = true')
      .andWhere('doctor_schedule.day_of_week = :weekday', {
        weekday: params.weekday,
      })
      .andWhere('specialty.id = :specialty_id', {
        specialty_id: params.specialty_id,
      });

    if (params.end_time) {
      query
        .andWhere('doctor_schedule.start_time < :end_time', {
          end_time: params.end_time,
        })
        .andWhere('doctor_schedule.end_time > :start_time', {
          start_time: params.start_time,
        });
    } else {
      query
        .andWhere('doctor_schedule.start_time <= :start_time', {
          start_time: params.start_time,
        })
        .andWhere('doctor_schedule.end_time > :start_time', {
          start_time: params.start_time,
        });
    }

    query
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_schedule_id = doctor_schedule.id
            AND a.appointment_date = :appointment_date
            AND a.status IN (:...activeStatuses)
            AND a.deleted_at IS NULL
        )`,
        {
          appointment_date: params.appointmentDateOnly,
          activeStatuses: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      )
      .orderBy('doctor_schedule.start_time', 'ASC')
      .addOrderBy('doctor_schedule.id', 'ASC');

    const candidates = await query.getMany();
    if (candidates.length === 0) {
      throw new ConflictException({
        code: APPOINTMENT_SLOT_UNAVAILABLE,
        message:
          'Không tìm thấy bác sĩ/ca khám phù hợp còn trống trong khung giờ yêu cầu.',
      });
    }
    return candidates[0];
  }

  async cancel(userId: number, appointmentId: number) {
    const isExistsAndPending = await this.isAppointmentExistAndPending(
      userId,
      appointmentId,
    );
    if (!isExistsAndPending) {
      throw new NotFoundException(
        'Không tìm thấy lịch hẹn hoặc bạn không thể hủy lịch này.',
      );
    }

    await this.appointmentRepo.update(appointmentId, {
      status: AppointmentStatus.CANCELLED,
    });

    await this.redisCacheService.delByPrefix('appointments:');
    await this.redisCacheService.delData(
      `user:${userId}:appointment:${appointmentId}`,
    );

    const cancelledAppointment = await this.getAppointmentDetail(
      userId,
      appointmentId,
    );

    await this.createAppointmentNotificationSafely(
      NotificationType.APPOINTMENT_CANCELLED,
      appointmentId,
    );

    return cancelledAppointment;
  }

  async findPersonalAppointments(
    userId: number,
    objectFilters: BodyPersonalAppointmentsDto,
  ) {
    let { page, limit } = objectFilters;
    const { appointmentStatus, relativeId } = objectFilters;
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `appointments:${userId}:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const query = this.baseAppointmentQuery()
      .where('appointment.booked_by_user.id = :userId', { userId })
      .orderBy('appointment.appointment_date', 'ASC')
      .take(limit)
      .skip(skip);

    if (appointmentStatus) {
      query.andWhere('appointment.status = :status', {
        status: appointmentStatus,
      });
    }

    if (relativeId) {
      query.andWhere('appointment.patient.id = :relativeId', {
        relativeId,
      });
    }

    const [appointments, total] = await query.getManyAndCount();

    const result = new PaginationResultDto(
      'appointments',
      AppointmentsMapper.toAppointmentResponseDtoList(appointments),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async findAndPaginationOfDoctor(
    userId: number,
    objectFilters: BodyFilterImproveDto,
  ) {
    let { page, limit } = objectFilters;
    const { appointmentStatus, relativeId, bookerId } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    if (!user.doctor.id) {
      throw new NotFoundException('Người dùng không phải là bác sĩ.');
    }

    const query = this.baseAppointmentQuery()
      .where('doctor.id = :doctorId', { doctorId: user.doctor.id })
      // Mới nhất/gần nhất trước — sắp cũ nhất lên đầu (mặc định cũ) khiến
      // lịch hẹn hiện tại/sắp tới bị chôn vùi sau hàng chục trang lịch sử.
      .orderBy('appointment.appointment_date', 'DESC')
      .take(limit)
      .skip(skip);

    if (appointmentStatus) {
      query.andWhere('appointment.status = :status', {
        status: appointmentStatus,
      });
    }

    if (relativeId) {
      query.andWhere('appointment.patient.id = :relativeId', {
        relativeId,
      });
    }

    if (bookerId) {
      query.andWhere('appointment.booked_by_user.id = :bookerId', {
        bookerId,
      });
    }

    const [appointments, total] = await query.getManyAndCount();

    const result = new PaginationResultDto(
      'appointments',
      AppointmentsMapper.toAppointmentResponseDtoList(appointments),
      total,
      page,
      limit,
    );

    return result;
  }

  async filterAndPaginationOfAdmin(objectFilters: BodyFilterImproveDto) {
    let { page, limit } = objectFilters;
    const {
      appointmentStatus,
      relativeId,
      bookerId,
      doctorId,
      appointmentDate,
    } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.baseAppointmentQuery()
      // Mới nhất/gần nhất trước — sắp cũ nhất lên đầu (mặc định cũ) khiến
      // lịch hẹn hiện tại/sắp tới bị chôn vùi sau hàng chục trang lịch sử.
      .orderBy('appointment.appointment_date', 'DESC')
      .take(limit)
      .skip(skip);

    if (appointmentStatus) {
      query.andWhere('appointment.status = :status', {
        status: appointmentStatus,
      });
    }

    if (relativeId) {
      query.andWhere('appointment.patient.id = :relativeId', {
        relativeId,
      });
    }

    if (bookerId) {
      query.andWhere('appointment.booked_by_user.id = :bookerId', {
        bookerId,
      });
    }

    if (appointmentDate) {
      const appointmentDateOnly = appointmentDate.slice(0, 10);
      query.andWhere('appointment.appointment_date = :appointmentDate', {
        appointmentDate: appointmentDateOnly,
      });
    }

    if (doctorId) {
      query.andWhere('doctor.id = :doctorId', { doctorId });
    }
    const [appointments, total] = await query.getManyAndCount();

    const result = new PaginationResultDto(
      'appointments',
      AppointmentsMapper.toAppointmentResponseDtoList(appointments),
      total,
      page,
      limit,
    );

    return result;
  }

  async updateStatus(
    appointmentId: number,
    status: AppointmentStatus,
    actorUserId: number,
    actorRoles: string[],
  ) {
    const appointment = await this.baseAppointmentQuery()
      .where('appointment.id = :appointmentId', { appointmentId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại.');
    }

    const isAdmin = actorRoles.includes(RoleName.ADMIN);
    const assignedDoctorUserId = appointment.doctor_schedule?.doctor?.user?.id;
    if (!isAdmin && assignedDoctorUserId !== actorUserId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật lịch hẹn của bác sĩ khác.',
      );
    }

    if (status === AppointmentStatus.EXPIRED) {
      throw new BadRequestException(
        'Trạng thái quá hạn khám được hệ thống tự động cập nhật.',
      );
    }

    const allowedTransitions: Partial<
      Record<AppointmentStatus, AppointmentStatus[]>
    > = {
      [AppointmentStatus.PENDING]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.ABSENT,
      ],
      [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
    };
    if (!allowedTransitions[appointment.status]?.includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái lịch hẹn từ ${appointment.status} sang ${status}.`,
      );
    }

    if (status === AppointmentStatus.IN_PROGRESS) {
      const appointmentStart = this.buildAppointmentStartDate(appointment);
      const now = new Date();
      if (now < appointmentStart) {
        throw new BadRequestException(
          'Chỉ có thể bắt đầu khám khi đã đến giờ hẹn.',
        );
      }
    }

    if (status === AppointmentStatus.COMPLETED) {
      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new BadRequestException('Lịch hẹn đã được đánh dấu khám xong.');
      }

      if (
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.ABSENT
      ) {
        throw new BadRequestException(
          'Không thể đánh dấu khám xong cho lịch hẹn đã hủy hoặc vắng mặt.',
        );
      }

      if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Chỉ có thể đánh dấu khám xong cho lịch hẹn đang được khám.',
        );
      }
    }

    if (status === AppointmentStatus.ABSENT) {
      if (appointment.status === AppointmentStatus.ABSENT) {
        throw new BadRequestException('Lịch hẹn đã được đánh dấu vắng mặt.');
      }

      if (
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'Không thể đánh dấu vắng mặt cho lịch hẹn đã hủy hoặc đã khám xong.',
        );
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException(
          'Chỉ có thể đánh dấu vắng mặt cho lịch hẹn đã được xác nhận.',
        );
      }

      const appointmentStart = this.buildAppointmentStartDate(appointment);
      const now = new Date();
      if (now < appointmentStart) {
        throw new BadRequestException(
          'Chỉ có thể đánh dấu vắng mặt khi đã đến ngày khám và qua giờ bắt đầu của lịch hẹn.',
        );
      }
    }

    appointment.status = status;
    // appointment vẫn giữ nguyên các quan hệ đã join từ baseAppointmentQuery()
    // ở đầu hàm (chỉ status đổi) — dùng lại thẳng cho cả response lẫn
    // notification, tránh query lại appointment lần nữa ngay sau khi vừa lưu.
    const savedAppointment = await this.appointmentRepo.save(appointment);

    await this.redisCacheService.delByPrefix('appointments:');
    await this.redisCacheService.delData(
      `user:${appointment.booked_by_user.id}:appointment:${appointmentId}`,
    );

    const response =
      AppointmentsMapper.toAppointmentResponseDto(savedAppointment);
    await this.createAppointmentNotificationSafely(
      status === AppointmentStatus.CANCELLED
        ? NotificationType.APPOINTMENT_CANCELLED
        : NotificationType.APPOINTMENT_STATUS_UPDATED,
      savedAppointment,
    );
    return response;
  }

  private buildAppointmentStartDate(appointment: Appointment) {
    return this.buildAppointmentDateTime(
      appointment,
      appointment.doctor_schedule?.start_time ?? '00:00:00',
    );
  }

  private buildAppointmentEndDate(appointment: Appointment) {
    return this.buildAppointmentDateTime(
      appointment,
      appointment.doctor_schedule?.end_time ?? '00:00:00',
    );
  }

  private buildAppointmentDateTime(appointment: Appointment, time: string) {
    const [hours, minutes, seconds] = time
      .split(':')
      .map((part) => Number(part) || 0);

    const appointmentDate = new Date(appointment.appointment_date);
    return new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate(),
      hours,
      minutes,
      seconds || 0,
    );
  }

  async getAppointmentDetail(userId: number, appointmentId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const cacheKey = `user:${userId}:appointment:${appointmentId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const appointment = await this.baseAppointmentQuery()
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('bookedByUser.id = :userId', { userId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại.');
    }

    const result = AppointmentsMapper.toAppointmentResponseDto(appointment);
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async getAppoitnmentToDayEarlyOfDoctor(userId: number, doctorId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointment = await this.baseAppointmentQuery()
      .where('doctor.id = :doctorId', { doctorId })
      .andWhere('appointment.appointment_date = :today', { today })
      .orderBy('appointment.appointment_date', 'ASC')
      .getOne();

    if (!appointment) {
      return null;
    }

    return AppointmentsMapper.toAppointmentResponseDto(appointment);
  }

  async isAppointmentExists(
    userId: number,
    appointmentId: number,
  ): Promise<boolean> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, booked_by_user: { id: userId } },
    });
    return !!appointment;
  }

  async isAppointmentExistAndPending(
    userId: number,
    appointmentId: number,
  ): Promise<boolean> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: appointmentId,
        status: AppointmentStatus.PENDING,
        booked_by_user: { id: userId },
      },
    });
    return !!appointment;
  }

  async isAppointmentExistsAndCompleted(
    userId: number,
    appointmentId: number,
  ): Promise<boolean> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: appointmentId,
        status: AppointmentStatus.COMPLETED,
        booked_by_user: { id: userId },
      },
    });
    return !!appointment;
  }

  async isAppointmentCompletedById(appointmentId: number): Promise<boolean> {
    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: appointmentId,
        status: AppointmentStatus.COMPLETED,
      },
    });
    return !!appointment;
  }

  async isAppointmentCompletedAndOwnedByDoctorUser(
    doctorUserId: number,
    appointmentId: number,
  ): Promise<boolean> {
    const isUserExist = await this.usersService.isUserExists(doctorUserId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: appointmentId,
        status: AppointmentStatus.COMPLETED,
        doctor_schedule: { doctor: { user: { id: doctorUserId } } },
      },
    });
    return !!appointment;
  }

  async isAppointmentExistsCompletedAndResult(
    userId: number,
    appointmentId: number,
  ): Promise<boolean> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const appointment = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.examination_result', 'examinationResult')
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.COMPLETED,
      })
      .andWhere('appointment.booked_by_user = :userId', { userId })
      .getOne();
    return !!appointment;
  }

  async numberOfUpcomingAppointmentsByUserId(userId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.appointmentRepo.count({
      where: {
        booked_by_user: { id: userId },
        appointment_date: MoreThanOrEqual(today),
        status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
      },
    });
    return count;
  }

  private async getAppointmentDetailTransaction(
    manager: EntityManager,
    userId: number,
    appointmentId: number,
  ) {
    const appointment = await manager
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('doctorSchedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('bookedByUser.id = :userId', { userId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại.');
    }

    return AppointmentsMapper.toAppointmentResponseDto(appointment);
  }

  async numberOfAppointmentsToDayActive() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.appointmentRepo.count({
      where: {
        appointment_date: Equal(today),
        status: In([
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING,
          AppointmentStatus.IN_PROGRESS,
        ]),
      },
    });
    return count;
  }

  async numberOfAppointmentsToDayCancelled() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.appointmentRepo.count({
      where: {
        appointment_date: Equal(today),
        status: AppointmentStatus.CANCELLED,
      },
    });
    return count;
  }

  async numberOfAppointmentsToDayActiveByDoctorId(doctorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.appointmentRepo.count({
      where: {
        appointment_date: Equal(today),
        status: In([
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING,
          AppointmentStatus.IN_PROGRESS,
        ]),
        doctor_schedule: { doctor: { id: doctorId } },
      },
    });
    return count;
  }

  async numberOfUpcomingAppointmentsByDoctorId(doctorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.appointmentRepo.count({
      where: {
        appointment_date: MoreThanOrEqual(today),
        status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
        doctor_schedule: { doctor: { id: doctorId } },
      },
    });
    return count;
  }

  private baseAppointmentQuery() {
    return this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('doctorSchedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .leftJoinAndSelect('appointment.examination_result', 'examinationResult')
      .leftJoinAndSelect(
        'appointment.satisfaction_rating',
        'satisfactionRating',
      );
  }

  private formatDateOnly(value: Date) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private async toAppointmentNotificationContext(
    appointment: Appointment,
  ): Promise<AppointmentNotificationContext | null> {
    let patientUserId: number | undefined = appointment.patient?.user?.id;
    if (!patientUserId && appointment.patient?.id) {
      const patientOwner = await this.dataSource
        .createQueryBuilder()
        .select('patient.user_id', 'userId')
        .from(Relative, 'patient')
        .where('patient.id = :patientId', { patientId: appointment.patient.id })
        .getRawOne<{ userId: number | string }>();
      patientUserId = patientOwner ? Number(patientOwner.userId) : undefined;
    }
    const doctorUser = appointment.doctor_schedule?.doctor?.user;
    if (!patientUserId || !doctorUser?.id) return null;

    return {
      appointmentId: appointment.id,
      patientUserId,
      doctorUserId: doctorUser.id,
      patientName: appointment.patient.fullname ?? 'Bệnh nhân',
      doctorName: doctorUser.fullname ?? 'Bác sĩ',
      appointmentDate: formatDateDDMMYYYY(appointment.appointment_date)!,
      startTime: appointment.doctor_schedule.start_time,
      endTime: appointment.doctor_schedule.end_time,
      status: appointment.status,
    };
  }

  private shouldEmailAppointmentEvent(
    type: NotificationType,
    status: AppointmentStatus,
  ) {
    return (
      type === NotificationType.APPOINTMENT_CREATED ||
      type === NotificationType.APPOINTMENT_CANCELLED ||
      type === NotificationType.APPOINTMENT_EXPIRED ||
      (type === NotificationType.APPOINTMENT_STATUS_UPDATED &&
        [
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.ABSENT,
        ].includes(status))
    );
  }

  private async enqueueAppointmentEmailSafely(
    notificationId: number,
    context: AppointmentNotificationContext,
    subject: string,
    content: string,
  ) {
    try {
      if (
        !(await this.settingsService.shouldSendAppointmentEmail(
          context.patientUserId,
        ))
      ) {
        return;
      }
      const recipient = await this.usersService.findByUserId(
        context.patientUserId,
      );
      if (!recipient?.email) return;
      await this.emailProducer.sendAppointment({
        notificationId,
        email: recipient.email,
        recipientName: recipient.fullname,
        subject,
        content,
      });
    } catch (error) {
      this.logger.error(
        `Không thể đưa email lịch hẹn #${context.appointmentId} vào hàng đợi: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * appointmentOrId nhận Appointment đã load sẵn (đủ join qua
   * baseAppointmentQuery/getAppointmentDetailTransaction) để tránh query lại,
   * hoặc appointmentId khi caller chỉ có id (ví dụ chỉ có response DTO).
   */
  private async createAppointmentNotificationSafely(
    type: NotificationType,
    appointmentOrId: Appointment | number,
  ) {
    const appointmentId =
      typeof appointmentOrId === 'number'
        ? appointmentOrId
        : appointmentOrId.id;
    try {
      const appointment =
        typeof appointmentOrId === 'number'
          ? await this.baseAppointmentQuery()
              .where('appointment.id = :appointmentId', { appointmentId })
              .getOne()
          : appointmentOrId;

      const context = appointment
        ? await this.toAppointmentNotificationContext(appointment)
        : null;

      if (!appointment || !context) {
        this.logger.warn(
          `Không tìm thấy chủ hồ sơ cho lịch hẹn #${appointmentId}.`,
        );
        return;
      }

      const responses =
        await this.notificationsService.createAppointmentNotifications(
          type,
          context,
        );
      if (this.shouldEmailAppointmentEvent(type, appointment.status)) {
        const patientNotification = responses.find(
          (notification) => notification.user?.id === context.patientUserId,
        );
        if (patientNotification) {
          await this.enqueueAppointmentEmailSafely(
            patientNotification.id,
            context,
            patientNotification.title,
            patientNotification.content,
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Không thể tạo thông báo cho lịch hẹn #${appointmentId}: ${message}`,
      );
    }
  }
}
