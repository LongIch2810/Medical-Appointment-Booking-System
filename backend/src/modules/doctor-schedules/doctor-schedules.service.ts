import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { BodyCreateScheduleDto } from './dto/request/bodyCreateSchedule.dto';
import { toMinutes } from 'src/utils/toMinutes';
import { DoctorScheduleMapper } from './doctor-schedules.mapper';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class DoctorSchedulesService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepo: Repository<DoctorSchedule>,
    private readonly doctorsService: DoctorsService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(userId: number, bodyCreateSchedule: BodyCreateScheduleDto) {
    try {
      const doctor = await this.doctorsService.findDoctorByUserId(userId);

      const startMinutes = toMinutes(bodyCreateSchedule.start_time);
      const endMinutes = toMinutes(bodyCreateSchedule.end_time);

      const schedulesExists = await this.doctorScheduleRepo.find({
        where: {
          doctor: { id: doctor.id },
          day_of_week: bodyCreateSchedule.day_of_week,
        },
      });

      const isOverlap = schedulesExists.some((s) => {
        const sStart = toMinutes(s.start_time);
        const sEnd = toMinutes(s.end_time);

        return endMinutes > sStart && startMinutes < sEnd;
      });

      if (isOverlap) {
        throw new ConflictException(
          'Khoảng thời gian này bị trùng với ca khám đã có.',
        );
      }

      const newSchedule = await this.doctorScheduleRepo.save({
        ...bodyCreateSchedule,
        is_active: true,
        doctor,
      });

      await this.redisCacheService.delData(
        `doctorSchedules:doctor:${doctor.id}`,
      );

      return DoctorScheduleMapper.toDoctorScheduleResponseDto(newSchedule);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Đã có lịch khám bị trùng vào thời gian này!',
        );
      }
      throw error;
    }
  }

  async update(
    userId: number,
    doctorScheduleId: number,
    bodyUpdateSchedule: BodyCreateScheduleDto,
  ) {
    const doctor = await this.doctorsService.findDoctorByUserId(userId);
    const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
    const startMinutes = toMinutes(bodyUpdateSchedule.start_time);
    const endMinutes = toMinutes(bodyUpdateSchedule.end_time);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.',
      );
    }

    const schedulesExists = await this.doctorScheduleRepo.find({
      where: {
        doctor: { id: doctor.id },
        day_of_week: bodyUpdateSchedule.day_of_week,
      },
    });

    const isOverlap = schedulesExists.some((item) => {
      if (item.id === doctorScheduleId) {
        return false;
      }
      const itemStart = toMinutes(item.start_time);
      const itemEnd = toMinutes(item.end_time);
      return endMinutes > itemStart && startMinutes < itemEnd;
    });

    if (isOverlap) {
      throw new ConflictException(
        'Khoảng thời gian này bị trùng với ca khám đã có.',
      );
    }

    Object.assign(schedule, bodyUpdateSchedule);
    const savedSchedule = await this.doctorScheduleRepo.save(schedule);
    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);
    return savedSchedule;
  }

  async getDoctorScheduleDetail(scheduleId: number) {
    const cacheKey = `doctorSchedule:${scheduleId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const schedule = await this.findScheduleByDoctorScheduleId(scheduleId);
    const result = DoctorScheduleMapper.toDoctorScheduleResponseDto(schedule);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }

  async updateActive(
    userId: number,
    doctorScheduleId: number,
    isActive: boolean,
  ) {
    const doctor = await this.doctorsService.findDoctorByUserId(userId);
    const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);

    if (schedule.is_active === isActive) {
      return { message: 'Trạng thái ca khám không thay đổi.' };
    }

    await this.doctorScheduleRepo.update(doctorScheduleId, {
      is_active: isActive,
    });

    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);

    return {
      message: isActive
        ? 'Kích hoạt ca khám thành công.'
        : 'Ngừng kích hoạt ca khám thành công.',
    };
  }

  async remove(userId: number, doctorScheduleId: number) {
    const doctor = await this.doctorsService.findDoctorByUserId(userId);
    const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
    await this.doctorScheduleRepo.delete(schedule.id);
    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);
    return { message: 'Xóa ca khám thành công.' };
  }

  async getSchedulesByDoctorId(doctorId: number) {
    const doctor = await this.doctorsService.findByDoctorId(doctorId);
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại trong hệ thống.');
    }

    const cacheKey = `doctorSchedules:doctor:${doctorId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;

    const schedules = await this.doctorScheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.appointments', 'appointment')
      .where('schedule.doctor_id = :doctorId', { doctorId })
      .select([
        'schedule.id',
        'schedule.day_of_week',
        'schedule.start_time',
        'schedule.end_time',
        'schedule.is_active',
        'appointment',
      ])
      .orderBy('schedule.day_of_week', 'ASC')
      .addOrderBy('schedule.start_time', 'ASC')
      .getMany();

    const result =
      DoctorScheduleMapper.toDoctorScheduleResponseDtoList(schedules);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }

  async getPersonalSchedules(userId: number) {
    const doctor = await this.doctorsService.findDoctorByUserId(userId);
    return this.getSchedulesByDoctorId(doctor.id);
  }

  async findScheduleByDoctorScheduleId(
    doctorScheduleId: number,
  ): Promise<DoctorSchedule> {
    const schedule = await this.doctorScheduleRepo.findOne({
      where: { id: doctorScheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Ca khám không tồn tại.');
    }

    return schedule;
  }

  async isScheduleExists(doctorScheduleId: number): Promise<boolean> {
    const schedule = await this.doctorScheduleRepo.findOne({
      where: { id: doctorScheduleId },
    });

    return !!schedule;
  }

  private async findOwnedSchedule(doctorId: number, doctorScheduleId: number) {
    const schedule = await this.doctorScheduleRepo.findOne({
      where: {
        id: doctorScheduleId,
        doctor: { id: doctorId },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Ca khám không tồn tại.');
    }

    return schedule;
  }
}
