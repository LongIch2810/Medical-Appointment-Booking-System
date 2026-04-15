import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Doctor from 'src/entities/doctor.entity';
import { Repository } from 'typeorm';
import { BodyFilterDoctorsDto } from './dto/request/bodyFilterDoctors.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { FilterItem } from 'src/shared/interfaces/filterItem';
import { setIsOutstandingDoctors } from 'src/utils/setIsOutstanding';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async findByDoctorId(doctorId: number): Promise<Doctor | null> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    return doctor;
  }

  async findDoctorByUserId(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }
    return doctor;
  }

  async filterAndPagination(
    page: number,
    limit: number,
    objectFilter: Partial<BodyFilterDoctorsDto>,
  ) {
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    // const cacheKey = `doctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilter || {})}`;
    // const cachedData = await this.redisCacheService.getData(cacheKey);
    // if (cachedData) {
    //   return cachedData;
    // }

    const doctorsQuery = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoin('doctor.user', 'user')
      .leftJoin('doctor.appointments', 'ap', 'ap.status = :status', {
        status: AppointmentStatus.COMPLETED,
      })
      .leftJoin('ap.satisfaction_rating', 'rating')
      .leftJoin('doctor.specialty', 'specialty')
      .select([
        'doctor.id AS id',
        'user.id AS user_id',
        'user.fullname AS fullname',
        'user.picture AS picture',
        'user.address AS address',
        'user.phone AS phone',
        'specialty.name AS specialty',
        'doctor.workplace AS workplace',
        'doctor.experience AS experience',
        'doctor.doctor_level AS doctor_level',
      ])
      .addSelect('COALESCE(AVG(rating.rating_score), 0)', 'avg_rating')
      .addSelect('COUNT(ap.id)', 'appointments_completed')
      .groupBy('doctor.id')
      .addGroupBy('user.id')
      .addGroupBy('user.fullname')
      .addGroupBy('user.picture')
      .addGroupBy('user.address')
      .addGroupBy('user.phone')
      .addGroupBy('specialty.name')
      .addGroupBy('doctor.workplace')
      .addGroupBy('doctor.experience')
      .addGroupBy('doctor.doctor_level')
      .where('doctor.deleted_at IS NULL')
      .limit(limit)
      .offset(skip);

    const filters: FilterItem[] = [
      objectFilter.specialty_id && {
        condition: 'specialty.id = :specialty_id',
        value: objectFilter.specialty_id,
        key: 'specialty_id',
      },
      objectFilter.min_experience && {
        condition: 'doctor.experience >= :min_experience',
        value: objectFilter.min_experience,
        key: 'min_experience',
      },
      objectFilter.max_experience && {
        condition: 'doctor.experience <= :max_experience',
        value: objectFilter.max_experience,
        key: 'max_experience',
      },
      objectFilter.workplace && {
        condition: 'LOWER(doctor.workplace) LIKE LOWER(:workplace)',
        value: `%${objectFilter.workplace}%`,
        key: 'workplace',
      },
      objectFilter.area && {
        condition: 'LOWER(user.address) LIKE LOWER(:area)',
        value: `%${objectFilter.area}%`,
        key: 'area',
      },
      objectFilter.search && {
        condition: 'LOWER(user.fullname) LIKE LOWER(:search)',
        value: `%${objectFilter.search}%`,
        key: 'search',
      },
    ].filter(Boolean) as FilterItem[];

    filters.forEach(({ condition, value, key }: FilterItem) => {
      doctorsQuery.andWhere(condition, { [key]: value });
    });

    const [doctors, total] = await Promise.all([
      doctorsQuery.getRawMany(),
      doctorsQuery.getCount(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const result = {
      total,
      doctors: setIsOutstandingDoctors(doctors),
      page,
      limit,
      totalPages,
    };

    // await this.redisCacheService.setData(cacheKey, result);

    return result;
  }

  async getDoctor(doctorId: number) {
    const cacheKey = `doctor:${doctorId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const doctor = await this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .where('doctor.id = :doctorId', { doctorId })
      .select([
        'doctor.id',
        'doctor.experience',
        'doctor.about_me',
        'doctor.workplace',
        'doctor.doctor_level',
        'specialty.name',
        'user.fullname',
        'user.address',
        'user.phone',
        'user.email',
        'user.picture',
      ])
      .getOne();

    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }
    await this.redisCacheService.setData(cacheKey, doctor);
    return doctor;
  }

  async getOutstandingDoctors() {
    const outstandingDoctorsCached = await this.redisCacheService.getData(
      `doctors:outstandingDoctors`,
    );
    if (outstandingDoctorsCached) return outstandingDoctorsCached;
    const outstandingDoctors = await this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoin('doctor.user', 'user')
      .leftJoin('doctor.appointments', 'ap', 'ap.status = :status', {
        status: AppointmentStatus.COMPLETED,
      })
      .leftJoin('ap.satisfaction_rating', 'rating')
      .leftJoin('doctor.specialty', 'specialty')
      .select([
        'doctor.id as id',
        'user.fullname AS fullname',
        'user.picture AS picture',
        'user.address AS address',
        'user.phone AS phone',
        'specialty.name AS specialty',
        'doctor.workplace AS workplace',
        'doctor.experience AS experience',
        'doctor.doctor_level AS doctor_level',
      ])
      .addSelect('COALESCE(AVG(rating.rating_score), 0)', 'avg_rating')
      .addSelect('COUNT(ap.id)', 'appointments_completed')
      .groupBy('doctor.id')
      .addGroupBy('user.fullname')
      .addGroupBy('user.picture')
      .addGroupBy('user.address')
      .addGroupBy('user.phone')
      .addGroupBy('specialty.name')
      .addGroupBy('doctor.workplace')
      .addGroupBy('doctor.experience')
      .addGroupBy('doctor.doctor_level')
      .orderBy('avg_rating', 'DESC')
      .addOrderBy('appointments_completed', 'DESC')
      .limit(4)
      .getRawMany();
    await this.redisCacheService.setData(
      `doctors:outstandingDoctors`,
      outstandingDoctors,
    );
    return outstandingDoctors;
  }
}
