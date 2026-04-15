import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExaminationResult from 'src/entities/examinationResult.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { BodyCreateExaminationResultDto } from './dto/request/bodyCreateExaminationResult.dto';
import { RelativesService } from '../relatives/relatives.service';
import { BodyFilterExaminationResultsDto } from './dto/request/bodyFilterExaminationResult.dto';
import { UsersService } from '../users/users.service';
import { BodyUpdateExaminationResultDto } from './dto/request/bodyUpdateExaminationResult.dto';

@Injectable()
export class ExaminationResultService {
  constructor(
    @InjectRepository(ExaminationResult)
    private readonly examinationResultRepo: Repository<ExaminationResult>,
    private readonly appointmentsService: AppointmentsService,
    private readonly relativesService: RelativesService,
    private readonly usersService: UsersService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(body: BodyCreateExaminationResultDto) {
    const isAppointmentExistsAndCompleted =
      await this.appointmentsService.isAppointmentCompletedById(
        body.appointment_id,
      );

    if (!isAppointmentExistsAndCompleted) {
      throw new BadRequestException(
        'Lịch khám không tồn tại hoặc chưa hoàn thành.',
      );
    }

    const isExaminationResultExists = await this.isExaminationResultExists(
      body.appointment_id,
    );

    if (isExaminationResultExists) {
      throw new BadRequestException(
        'Kết quả khám bệnh đã tồn tại cho lịch khám này.',
      );
    }

    const createdExaminationResult = this.examinationResultRepo.create(body);
    return this.examinationResultRepo.save(createdExaminationResult);
  }

  async update(
    examinationResultId: number,
    bodyUpdateExaminationResult: BodyUpdateExaminationResultDto,
  ) {
    const examinationResult = await this.examinationResultRepo.findOne({
      where: { id: examinationResultId },
    });

    if (!examinationResult) {
      throw new NotFoundException('Kết quả khám bệnh không tồn tại');
    }

    Object.assign(examinationResult, bodyUpdateExaminationResult);
    return this.examinationResultRepo.save(examinationResult);
  }

  async findExaminationResultById(id: number) {
    const examinationResult = await this.baseExaminationResultQuery()
      .andWhere('examination_result.id = :id', { id })
      .getOne();

    if (!examinationResult) {
      throw new NotFoundException('Kết quả khám bệnh không tồn tại');
    }

    return examinationResult;
  }

  async findExaminationResultByAppointmentId(appointmentId: number) {
    const examinationResult = await this.baseExaminationResultQuery()
      .andWhere('appointment.id = :appointmentId', { appointmentId })
      .getOne();

    if (!examinationResult) {
      throw new NotFoundException(
        'Không tìm thấy kết quả khám bệnh cho lịch hẹn này',
      );
    }

    return examinationResult;
  }

  async findExaminationResultsByRelativeId(
    relativeId: number,
    body: BodyFilterExaminationResultsDto,
  ) {
    const isRelativeExists =
      await this.relativesService.isRelativeExistsByRelativeId(relativeId);

    if (!isRelativeExists) {
      throw new NotFoundException('Bệnh nhân không tồn tại');
    }

    const { limit, page, arrange, date } = body;
    const skip = (page - 1) * limit;

    const query = this.baseExaminationResultQuery()
      .where('patient.id = :relativeId', { relativeId })
      .orderBy(
        'examination_result.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (date) {
      query.andWhere('examination_result.created_at >= :date', { date });
    }

    const [examinationResults, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      examinationResults,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findExaminationResultsByUserId(
    userId: number,
    body: BodyFilterExaminationResultsDto,
  ) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const { limit, page, arrange, date, relativeId } = body;
    const skip = (page - 1) * limit;

    const query = this.baseExaminationResultQuery()
      .where('user.id = :userId', { userId })
      .orderBy(
        'examination_result.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (date) {
      query.andWhere('examination_result.created_at >= :date', { date });
    }

    if (relativeId) {
      query.andWhere('patient.id = :relativeId', { relativeId });
    }

    const [examinationResults, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      examinationResults,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async filterAndPagination(body: BodyFilterExaminationResultsDto) {
    const { limit, page, arrange, date, relativeId } = body;
    const skip = (page - 1) * limit;
    const query = this.baseExaminationResultQuery()
      .orderBy(
        'examination_result.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (date) {
      query.andWhere('examination_result.created_at >= :date', { date });
    }

    if (relativeId) {
      query.andWhere('patient.id = :relativeId', { relativeId });
    }

    const [examinationResults, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      examinationResults,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async isExaminationResultExists(appointmentId: number) {
    const examinationResult = await this.examinationResultRepo.findOne({
      where: { appointment: { id: appointmentId } },
    });
    return !!examinationResult;
  }

  async numberOfExaminationResultsByUserId(userId: number) {
    const count = await this.examinationResultRepo.count({
      where: {
        appointment: {
          patient: {
            user: {
              id: userId,
            },
          },
        },
      },
    });
    return count;
  }

  private baseExaminationResultQuery() {
    return this.examinationResultRepo
      .createQueryBuilder('examination_result')
      .leftJoinAndSelect('examination_result.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('patient.relationship', 'relationship')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule')
      .leftJoinAndSelect('doctor_schedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctor_user')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .select([
        'examination_result.id',
        'examination_result.symptoms',
        'examination_result.diagnosis',
        'examination_result.treatment',
        'examination_result.prescription',
        'examination_result.created_at',
        'appointment.id',
        'appointment.status',
        'appointment.appointment_date',
        'patient.id',
        'patient.fullname',
        'patient.phone',
        'user.id',
        'user.fullname',
        'relationship.relationship_code',
        'relationship.relationship_name',
        'doctor.id',
        'doctor_user.id',
        'doctor_user.fullname',
        'specialty.id',
        'specialty.name',
        'doctor_schedule.id',
        'doctor_schedule.day_of_week',
        'doctor_schedule.start_time',
        'doctor_schedule.end_time',
      ]);
  }
}
