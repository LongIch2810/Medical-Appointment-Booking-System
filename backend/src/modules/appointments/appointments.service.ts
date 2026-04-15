import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Appointment from 'src/entities/appointment.entity';
import {
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
import { BodyPersonalAppointmentsDto } from './dto/request/bodyPersonalAppointments.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { UsersService } from '../users/users.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { RelativesService } from '../relatives/relatives.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly doctorSchedulesService: DoctorSchedulesService,
    private readonly relativesService: RelativesService,
    private readonly redisCacheService: RedisCacheService,
    private readonly gateway: WebsocketGateway,
  ) {}

  async createWithRetry(
    userId: number,
    body: BodyCreateAppointmentDto,
    maxRetries: number = 3,
  ) {
    if (body.booking_mode === BookingMode.USER_SELECT)
      return this.create(userId, body);
    for (let i = 1; i <= maxRetries; i++) {
      try {
        const newAppointment = await this.create(userId, body);
        this.gateway.notifyBookAppointmentSuccess(userId, newAppointment);
        return newAppointment;
      } catch (error: any) {
        const isPgUnique =
          error instanceof QueryFailedError &&
          error.driverError?.code === '23505' &&
          error.driverError?.constraint === 'unique_doctor_schedule_date';

        if (!isPgUnique) {
          this.gateway.notifyBookAppointmentFail(
            userId,
            'Đặt lịch khám đã có lỗi xảy ra !',
          );
          throw error;
        }

        if (i < maxRetries) {
          const delay = Math.pow(2, i) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
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
  }

  async create(userId: number, body: BodyCreateAppointmentDto) {
    const user_booked = await this.usersService.findByUserId(userId);
    if (!user_booked) throw new NotFoundException('Không tìm thấy người dùng.');
    const { appointment_date, relative_id, booking_mode, doctor_schedule_id } =
      body;

    const appointmentDate = new Date(appointment_date);
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

    const patient = await this.relativesService.findOwnedByUserId(
      userId,
      relative_id,
    );
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân.');

    const chosenSchedule: DoctorSchedule =
      await this.doctorSchedulesService.findScheduleByDoctorScheduleId(
        doctor_schedule_id,
      );
    if (!chosenSchedule)
      throw new NotFoundException(
        'Bác sĩ nghỉ hoặc không có làm việc trong ngày bạn yêu cầu !',
      );
    const appointment = this.appointmentRepo.create({
      appointment_date: appointmentDate,
      doctor_schedule: chosenSchedule,
      booked_by_user: user_booked,
      patient,
      booking_mode,
    });

    const saved = await this.appointmentRepo.save(appointment);

    const appointmentDetail = await this.getAppointment(userId, saved.id);

    return appointmentDetail;
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
    return { message: 'Hủy lịch hẹn thành công.' };
  }

  async findPersonalAppointments(
    userId: number,
    objectFilters: BodyPersonalAppointmentsDto,
  ) {
    let { page, limit } = objectFilters;
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
      .where('appointment.patient.id = :userId', { userId })
      .orderBy('appointment.appointment_date', 'DESC')
      .take(limit)
      .skip(skip);

    if (objectFilters?.appointmentStatus) {
      query.andWhere('appointment.status = :status', {
        status: objectFilters.appointmentStatus,
      });
    }

    const [appointments, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const result = {
      appointments,
      total,
      totalPages,
      page,
      limit,
    };

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async getAppointment(userId: number, appointmentId: number) {
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

    await this.redisCacheService.setData(cacheKey, appointment, 3600);

    return appointment;
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

  private baseAppointmentQuery() {
    return this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .select([
        'appointment.id',
        'appointment.appointment_date',
        'doctorSchedule.day_of_week',
        'doctorSchedule.start_time',
        'doctorSchedule.end_time',
        'appointment.status',
        'doctor.id',
        'doctorUser.fullname',
        'doctorUser.address',
        'doctorUser.email',
        'doctorUser.phone',
        'doctorUser.picture',
        'specialty.id',
        'specialty.name',
        'patient.id',
        'patient.fullname',
        'patient.username',
        'bookedByUser.id',
        'bookedByUser.fullname',
      ]);
  }
}
