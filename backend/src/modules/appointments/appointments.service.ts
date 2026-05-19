import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Appointment from 'src/entities/appointment.entity';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  MoreThanOrEqual,
  Not,
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
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { AppointmentsMapper } from './appointments.mapper';
import { isPgDriverError } from '../../utils/isPgDriverError';
import Relative from '../../entities/relative.entity';
import { AppointmentResponseDto } from './dto/response/appointmentResponse.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly doctorSchedulesService: DoctorSchedulesService,
    private readonly relativesService: RelativesService,
    private readonly redisCacheService: RedisCacheService,
    private readonly dataSource: DataSource,
    private readonly gateway: WebsocketGateway,
  ) {}

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
    return this.dataSource.transaction(async (manager) => {
      const user_booked = await this.usersService.findByUserId(userId);
      if (!user_booked)
        throw new NotFoundException('Không tìm thấy người dùng.');
      const {
        appointment_date,
        relative_id,
        booking_mode,
        doctor_schedule_id,
      } = body;

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

      const patient = await manager
        .getRepository(Relative)
        .createQueryBuilder('relative')
        .setLock('pessimistic_write')
        .where('relative.id = :relative_id', { relative_id })
        .andWhere('relative.user.id = :userId', { userId })
        .getOne();
      if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân.');

      const chosenSchedule: DoctorSchedule | null = await manager.findOne(
        DoctorSchedule,
        {
          where: {
            id: doctor_schedule_id,
            is_active: true,
          },
        },
      );
      if (!chosenSchedule)
        throw new NotFoundException(
          'Bác sĩ nghỉ hoặc không có làm việc trong ngày bạn yêu cầu !',
        );

      const appointmentDayOfWeek = dayNumberToEnum[appointmentDate.getDay()];
      if (chosenSchedule.day_of_week !== appointmentDayOfWeek) {
        throw new BadRequestException(
          'Ca khám không khớp với ngày mà bạn yêu cầu. Vui lòng chọn ca khác.',
        );
      }

      const patientConflict = await manager
        .getRepository(Appointment)
        .createQueryBuilder('appointment')
        .innerJoin('appointment.doctor_schedule', 'doctor_schedule')
        .where('appointment.patient.id = :patientId', { patientId: patient.id })
        .andWhere('DATE(appointment.appointment_date) = :appointmentDate', {
          appointmentDate: appointmentDateOnly,
        })
        .andWhere('doctor_schedule.start_time < :new_end_time', {
          new_end_time: chosenSchedule.end_time,
        })
        .andWhere('doctor_schedule.end_time > :new_start_time', {
          new_start_time: chosenSchedule.start_time,
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
    });
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

    const cancelledAppointment = await this.getAppointmentDetail(
      userId,
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

    // const cacheKey = `appointments:${userId}:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    // const cachedData = await this.redisCacheService.getData(cacheKey);
    // if (cachedData) {
    //   return cachedData;
    // }
    const query = this.baseAppointmentQuery()
      .where('appointment.booked_by_user.id = :userId', { userId })
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

    const [appointments, total] = await query.getManyAndCount();

    const result = new PaginationResultDto(
      'appointments',
      AppointmentsMapper.toAppointmentResponseDtoList(appointments),
      total,
      page,
      limit,
    );

    // await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async getAppointmentDetail(userId: number, appointmentId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    // const cacheKey = `user:${userId}:appointment:${appointmentId}`;
    // const cachedData = await this.redisCacheService.getData(cacheKey);
    // if (cachedData) {
    //   return cachedData;
    // }

    const appointment = await this.baseAppointmentQuery()
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('bookedByUser.id = :userId', { userId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại.');
    }

    // await this.redisCacheService.setData(cacheKey, appointment, 3600);

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

  async isAppointmentExistsCompletedAndResult(
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
        examination_result: Not(IsNull()),
        booked_by_user: { id: userId },
      },
    });
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

  private baseAppointmentQuery() {
    return this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('doctorSchedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser')
      .leftJoinAndSelect('doctor.specialty', 'specialty');
  }
}
