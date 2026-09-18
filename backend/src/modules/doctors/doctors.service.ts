import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { BodyCreateDoctorDto } from './dto/request/bodyCreateDoctor.dto';
import { BodyUpdateDoctorDto } from './dto/request/bodyUpdateDoctor.dto';
import User from 'src/entities/user.entity';
import Specialty from 'src/entities/specialty.entity';
import { plainToInstance } from 'class-transformer';
import { DoctorSuggestionResponseDto } from './dto/response/doctorSuggestionResponse.dto';
import { SpecialtySuggestionResponseDto } from './dto/response/specialtySuggestionResponse.dto';

const normalizeDoctorAvgRating = (value: unknown) => {
  const avgRating = Number(value);
  return Number.isFinite(avgRating) && avgRating > 0 ? avgRating : 5;
};

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(body: BodyCreateDoctorDto) {
    const user = await this.userRepo.findOne({ where: { id: body.user_id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const specialty = await this.specialtyRepo.findOne({
      where: { id: body.specialty_id },
    });
    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    const existedDoctor = await this.doctorRepo.findOne({
      where: { user: { id: body.user_id } },
    });
    if (existedDoctor) {
      throw new ConflictException('Người dùng đã là bác sĩ.');
    }

    const doctor = this.doctorRepo.create({
      experience: body.experience,
      about_me: body.about_me,
      workplace: body.workplace,
      doctor_level: body.doctor_level,
      user,
      specialty,
    });

    const newDoctor = await this.doctorRepo.save(doctor);
    await this.redisCacheService.delByPrefix('doctors:');
    return this.getDoctorDetail(newDoctor.id);
  }

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
    if (
      min_experience !== undefined &&
      max_experience !== undefined &&
      min_experience > max_experience
    ) {
      throw new BadRequestException(
        'min_experience must be less than max_experience',
      );
    }
    let { page, limit } = objectFilter;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `doctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilter || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const doctorsQuery = this.baseDoctorQuery().take(limit).skip(skip);

    const totalQuery = this.baseTotalDoctorQuery();

    const filters: FilterItem[] = [
      specialty_id !== undefined && {
        condition: 'specialty.id = :specialty_id',
        value: specialty_id,
        key: 'specialty_id',
      },
      min_experience !== undefined && {
        condition: 'doctor.experience >= :min_experience',
        value: min_experience,
        key: 'min_experience',
      },
      max_experience !== undefined && {
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
        condition:
          'UNACCENT(LOWER(user.fullname)) LIKE UNACCENT(LOWER(:search))',
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
        avg_rating: normalizeDoctorAvgRating(row?.avg_rating),
        appointments_completed: Number(row?.appointments_completed ?? 0),
      };
    });

    const result = new PaginationResultDto(
      'doctors',
      DoctorsMapper.toDoctorResponseDtoList(setIsOutstandingDoctors(doctors)),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async getSuggestions(search: string) {
    const term = search.trim();
    const prefixParam = `${term}%`;
    const likeParam = `%${term}%`;

    const [doctorRows, specialtyRows] = await Promise.all([
      this.doctorRepo
        .createQueryBuilder('doctor')
        .innerJoin('doctor.user', 'user')
        .leftJoin('doctor.specialty', 'specialty')
        .select('doctor.id', 'id')
        .addSelect('user.fullname', 'fullname')
        .addSelect('user.picture', 'picture')
        .addSelect('specialty.name', 'specialty_name')
        .addSelect(
          `CASE
            WHEN UNACCENT(LOWER(user.fullname)) = UNACCENT(LOWER(:term)) THEN 0
            WHEN UNACCENT(LOWER(user.fullname)) LIKE UNACCENT(LOWER(:prefixParam)) THEN 1
            WHEN UNACCENT(LOWER(user.fullname)) LIKE UNACCENT(LOWER(:likeParam)) THEN 2
            ELSE 3
          END`,
          'match_rank',
        )
        .addSelect(
          'similarity(UNACCENT(LOWER(user.fullname)), UNACCENT(LOWER(:term)))',
          'similarity_score',
        )
        .where(
          `UNACCENT(LOWER(user.fullname)) LIKE UNACCENT(LOWER(:likeParam))
           OR similarity(UNACCENT(LOWER(user.fullname)), UNACCENT(LOWER(:term))) > 0.3`,
        )
        .setParameters({ term, prefixParam, likeParam })
        .orderBy('match_rank', 'ASC')
        .addOrderBy('similarity_score', 'DESC')
        .addOrderBy('user.fullname', 'ASC')
        .limit(5)
        .getRawMany(),
      this.specialtyRepo
        .createQueryBuilder('specialty')
        .select('specialty.id', 'id')
        .addSelect('specialty.name', 'name')
        .addSelect(
          `CASE
            WHEN UNACCENT(LOWER(specialty.name)) = UNACCENT(LOWER(:term)) THEN 0
            WHEN UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:prefixParam)) THEN 1
            WHEN UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:likeParam)) THEN 2
            ELSE 3
          END`,
          'match_rank',
        )
        .addSelect(
          'similarity(UNACCENT(LOWER(specialty.name)), UNACCENT(LOWER(:term)))',
          'similarity_score',
        )
        .where(
          `UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:likeParam))
           OR similarity(UNACCENT(LOWER(specialty.name)), UNACCENT(LOWER(:term))) > 0.3`,
        )
        .setParameters({ term, prefixParam, likeParam })
        .orderBy('match_rank', 'ASC')
        .addOrderBy('similarity_score', 'DESC')
        .addOrderBy('specialty.name', 'ASC')
        .limit(3)
        .getRawMany(),
    ]);

    const doctors = plainToInstance(
      DoctorSuggestionResponseDto,
      doctorRows.map((row) => ({
        id: Number(row.id),
        fullname: row.fullname,
        picture: row.picture,
        specialty: row.specialty_name ?? null,
      })),
      { excludeExtraneousValues: true },
    );

    const specialties = plainToInstance(
      SpecialtySuggestionResponseDto,
      specialtyRows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
      { excludeExtraneousValues: true },
    );

    return { doctors, specialties };
  }

  async getDoctorDetail(doctorId: number) {
    const cacheKey = `doctor:${doctorId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const { entities, raw } = await this.baseDoctorQuery()
      .leftJoinAndSelect(
        'doctor_schedules.appointments',
        'schedule_appointments',
        'schedule_appointments.status IN (:...occupiedStatuses)',
        {
          occupiedStatuses: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      )
      .where('doctor.id = :doctorId', { doctorId })
      .getRawAndEntities();

    if (entities.length === 0) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }
    const row = raw.find((i) => Number(i.doctor_id) === doctorId);
    const doctor = {
      ...entities[0],
      avg_rating: normalizeDoctorAvgRating(row?.avg_rating),
      appointments_completed: Number(row?.appointments_completed ?? 0),
    };
    const result = DoctorsMapper.toDoctorResponseDto(
      setIsOutstandingDoctor(doctor),
    );
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }

  async update(doctorId: number, body: BodyUpdateDoctorDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['user', 'specialty'],
    });
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }

    if (body.specialty_id !== undefined) {
      const specialty = await this.specialtyRepo.findOne({
        where: { id: body.specialty_id },
      });
      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại.');
      }
      doctor.specialty = specialty;
    }

    if (body.experience !== undefined) doctor.experience = body.experience;
    if (body.about_me !== undefined) doctor.about_me = body.about_me;
    if (body.workplace !== undefined) doctor.workplace = body.workplace;
    if (body.doctor_level !== undefined)
      doctor.doctor_level = body.doctor_level;

    await this.doctorRepo.save(doctor);
    await this.redisCacheService.delByPrefix('doctors:');
    await this.redisCacheService.delData(`doctor:${doctorId}`);
    return this.getDoctorDetail(doctorId);
  }

  async remove(doctorId: number) {
    await this.getDoctorDetail(doctorId);
    await this.doctorRepo.softDelete(doctorId);
    await this.redisCacheService.delByPrefix('doctors:');
    await this.redisCacheService.delData(`doctor:${doctorId}`);
    return { message: 'Xóa bác sĩ thành công.' };
  }

  async getOutstandingDoctors() {
    const cacheKey = `doctors:outstandingDoctors`;
    const outstandingDoctorsCached =
      await this.redisCacheService.getData(cacheKey);
    if (outstandingDoctorsCached) return outstandingDoctorsCached;
    const query = this.baseDoctorQuery()
      .orderBy('avg_rating', 'DESC')
      .addOrderBy('appointments_completed', 'DESC');
    const { entities, raw } = await query.getRawAndEntities();
    const outstandingDoctors = entities.map((doctor) => {
      const row = raw.find((i) => Number(i.doctor_id) === doctor.id);

      return {
        ...doctor,
        avg_rating: normalizeDoctorAvgRating(row?.avg_rating),
        appointments_completed: Number(row?.appointments_completed ?? 0),
      };
    });
    const result = DoctorsMapper.toDoctorResponseDtoList(
      setIsOutstandingDoctors(outstandingDoctors)
        .filter((doctor) => doctor.isOutstanding)
        .slice(0, 4),
    );
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  private baseDoctorQuery() {
    const subquery = this.doctorRepo
      .createQueryBuilder('d')
      .subQuery()
      .select('ds.doctor_id', 'doctor_id')
      .addSelect('COUNT(ap.id)', 'appointments_completed')
      .addSelect('COALESCE(AVG(rating.rating_score), 5)', 'avg_rating')
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
      .addSelect('COALESCE(doctor_stats.avg_rating, 5)', 'avg_rating')
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
