import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Doctor from 'src/entities/doctor.entity';
import { Repository } from 'typeorm';
import { BodyFilterDoctorsDto } from './dto/request/bodyFilterDoctors.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { FilterItem } from 'src/shared/interfaces/filterItem';
import {
  setIsOutstandingDoctor,
  setIsOutstandingDoctors,
} from 'src/utils/setIsOutstanding';
import { DoctorsMapper } from './doctors.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

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

  async filterAndPagination(objectFilter: BodyFilterDoctorsDto) {
    const {
      specialty_id,
      min_experience,
      max_experience,
      workplace,
      area,
      search,
    } = objectFilter;
    let { page, limit } = objectFilter;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    // const cacheKey = `doctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilter || {})}`;
    // const cachedData = await this.redisCacheService.getData(cacheKey);
    // if (cachedData) {
    //   return cachedData;
    // }

    const doctorsQuery = this.baseDoctorQuery().take(limit).skip(skip);

    const totalQuery = this.baseTotalDoctorQuery();

    const filters: FilterItem[] = [
      specialty_id && {
        condition: 'specialty.id = :specialty_id',
        value: specialty_id,
        key: 'specialty_id',
      },
      min_experience && {
        condition: 'doctor.experience >= :min_experience',
        value: min_experience,
        key: 'min_experience',
      },
      max_experience && {
        condition: 'doctor.experience <= :max_experience',
        value: max_experience,
        key: 'max_experience',
      },
      workplace && {
        condition: 'LOWER(doctor.workplace) LIKE LOWER(:workplace)',
        value: `%${workplace}%`,
        key: 'workplace',
      },
      area && {
        condition: 'LOWER(user.address) LIKE LOWER(:area)',
        value: `%${area}%`,
        key: 'area',
      },
      search && {
        condition: 'LOWER(user.fullname) LIKE LOWER(:search)',
        value: `%${search}%`,
        key: 'search',
      },
    ].filter(Boolean) as FilterItem[];

    filters.forEach(({ condition, value, key }: FilterItem) => {
      doctorsQuery.andWhere(condition, { [key]: value });
      totalQuery.andWhere(condition, { [key]: value });
    });

    const { entities, raw } = await doctorsQuery.getRawAndEntities();
    const total = await totalQuery.getCount();

    const doctors = entities.map((doctor) => {
      const row = raw.find((i) => Number(i.doctor_id) === doctor.id);

      return {
        ...doctor,
        avg_rating: Number(row?.avg_rating ?? 0),
        appointments_completed: Number(row?.appointments_completed ?? 0),
      };
    });
    console.log(
      'Fetched doctors:',
      DoctorsMapper.toDoctorResponseDtoList(setIsOutstandingDoctors(doctors)),
    );

    const result = new PaginationResultDto(
      'doctors',
      DoctorsMapper.toDoctorResponseDtoList(setIsOutstandingDoctors(doctors)),
      total,
      page,
      limit,
    );

    // await this.redisCacheService.setData(cacheKey, result);

    return result;
  }

  async getDoctorDetail(doctorId: number) {
    // const cacheKey = `doctor:${doctorId}`;
    // const cachedData = await this.redisCacheService.getData(cacheKey);
    // if (cachedData) return cachedData;
    const { entities, raw } = await this.baseDoctorQuery()
      .where('doctor.id = :doctorId', { doctorId })
      .getRawAndEntities();

    if (entities.length === 0) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }
    const row = raw.find((i) => Number(i.doctor_id) === doctorId);
    // await this.redisCacheService.setData(cacheKey, doctor, 3600);
    const doctor = {
      ...entities[0],
      avg_rating: Number(row?.avg_rating ?? 0),
      appointments_completed: Number(row?.appointments_completed ?? 0),
    };
    return DoctorsMapper.toDoctorResponseDto(setIsOutstandingDoctor(doctor));
  }

  async getOutstandingDoctors() {
    // const outstandingDoctorsCached = await this.redisCacheService.getData(
    //   `doctors:outstandingDoctors`,
    // );
    // if (outstandingDoctorsCached) return outstandingDoctorsCached;
    const query = this.baseDoctorQuery()
      .orderBy('avg_rating', 'DESC')
      .addOrderBy('appointments_completed', 'DESC');
    const { entities, raw } = await query.getRawAndEntities();
    const outstandingDoctors = entities.map((doctor) => {
      const row = raw.find((i) => Number(i.doctor_id) === doctor.id);

      return {
        ...doctor,
        avg_rating: Number(row?.avg_rating ?? 0),
        appointments_completed: Number(row?.appointments_completed ?? 0),
      };
    });
    // await this.redisCacheService.setData(
    //   `doctors:outstandingDoctors`,
    //   outstandingDoctors,
    // );

    return DoctorsMapper.toDoctorResponseDtoList(
      setIsOutstandingDoctors(outstandingDoctors)
        .filter((doctor) => doctor.isOutstanding)
        .slice(0, 4),
    );
  }

  private baseDoctorQuery() {
    const subquery = this.doctorRepo
      .createQueryBuilder('d')
      .subQuery()
      .select('ds.doctor_id', 'doctor_id')
      .addSelect('COUNT(ap.id)', 'appointments_completed')
      .addSelect('COALESCE(AVG(rating.rating_score), 0)', 'avg_rating')
      .from('doctor_schedules', 'ds')
      .leftJoin('ds.appointments', 'ap', 'ap.status = :status')
      .leftJoin('ap.satisfaction_rating', 'rating')
      .groupBy('ds.doctor_id')
      .getQuery();
    return this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.doctor_schedules', 'doctor_schedules')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .leftJoin(
        `(${subquery})`,
        'doctor_stats',
        'doctor_stats.doctor_id = doctor.id',
      )
      .setParameters({ status: AppointmentStatus.COMPLETED })
      .addSelect('COALESCE(doctor_stats.avg_rating, 0)', 'avg_rating')
      .addSelect(
        'COALESCE(doctor_stats.appointments_completed, 0)',
        'appointments_completed',
      );
  }

  private baseTotalDoctorQuery() {
    return this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoin('doctor.user', 'user')
      .leftJoin('doctor.specialty', 'specialty');
  }
}
