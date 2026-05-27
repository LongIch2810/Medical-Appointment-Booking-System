import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import ExaminationResult from 'src/entities/examinationResult.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { BodyCreateExaminationResultDto } from './dto/request/bodyCreateExaminationResult.dto';
import { RelativesService } from '../relatives/relatives.service';
import { BodyFilterExaminationResultsDto } from './dto/request/bodyFilterExaminationResult.dto';
import { UsersService } from '../users/users.service';
import { BodyUpdateExaminationResultDto } from './dto/request/bodyUpdateExaminationResult.dto';
import { ExaminationResultMapper } from './examination-result.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

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

  async create(userId: number, body: BodyCreateExaminationResultDto) {
    try {
      const isAppointmentExistsAndCompleted =
        await this.appointmentsService.isAppointmentCompletedAndOwnedByDoctorUser(
          userId,
          body.appointment_id,
        );

      if (!isAppointmentExistsAndCompleted) {
        throw new BadRequestException(
          'Lịch khám không tồn tại, chưa hoàn thành hoặc không thuộc về bác sĩ đang đăng nhập.',
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

      const { appointment_id, ...examData } = body;
      const createdExaminationResult = this.examinationResultRepo.create({
        ...examData,
        appointment: { id: appointment_id },
      });
      const newExaminationResult = await this.examinationResultRepo.save(
        createdExaminationResult,
      );
      return ExaminationResultMapper.toExaminationResultResponseDto(
        newExaminationResult,
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new BadRequestException(
          'Kết quả khám bệnh đã tồn tại cho lịch khám này.',
        );
      }
      throw error;
    }
  }

  async update(
    userId: number,
    examinationResultId: number,
    bodyUpdateExaminationResult: BodyUpdateExaminationResultDto,
  ) {
    const examinationResult =
      await this.findExaminationResultById(examinationResultId);

    this.checkDoctorOwnsExaminationResult(userId, examinationResult);

    Object.assign(examinationResult, bodyUpdateExaminationResult);
    const updatedExaminationResult =
      await this.examinationResultRepo.save(examinationResult);
    return ExaminationResultMapper.toExaminationResultResponseDto(
      updatedExaminationResult,
    );
  }

  async remove(userId: number, id: number) {
    const examinationResult = await this.findExaminationResultById(id);

    this.checkDoctorOwnsExaminationResult(userId, examinationResult);

    await this.examinationResultRepo.softDelete(examinationResult);
    const deletedExaminationResult = await this.getExaminationResultDetail(id);
    return deletedExaminationResult;
  }

  async findExaminationResultsByDoctorUserId(
    userId: number,
    objectFilters: BodyFilterExaminationResultsDto,
  ) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    let { limit, page } = objectFilters;
    const { date, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.baseExaminationResultQuery()
      .where('doctor_user.id = :userId', { userId })
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
    const result = new PaginationResultDto(
      'examination_results',
      ExaminationResultMapper.toExaminationResultResponseDtoList(
        examinationResults,
      ),
      total,
      page,
      limit,
    );
    return result;
  }

  private checkDoctorOwnsExaminationResult(
    userId: number,
    examinationResult: ExaminationResult,
  ) {
    if (!examinationResult.appointment) {
      throw new BadRequestException(
        'Kết quả khám không có thông tin lịch hẹn.',
      );
    }
    const doctorUserId =
      examinationResult.appointment.doctor_schedule?.doctor?.user?.id;
    if (!doctorUserId || doctorUserId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền thao tác với kết quả khám này.',
      );
    }
  }

  async getExaminationResultDetail(id: number) {
    const examinationResult = await this.findExaminationResultById(id);
    return ExaminationResultMapper.toExaminationResultResponseDto(
      examinationResult,
    );
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
    userId: number,
    relativeId: number,
    objectFilters: BodyFilterExaminationResultsDto,
  ) {
    const isRelativeExists =
      await this.relativesService.isRelativeExistsByRelativeId(
        userId,
        relativeId,
      );

    if (!isRelativeExists) {
      throw new NotFoundException('Bệnh nhân không tồn tại');
    }

    let { limit, page } = objectFilters;
    const { date, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
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
    const result = new PaginationResultDto(
      'examination_results',
      ExaminationResultMapper.toExaminationResultResponseDtoList(
        examinationResults,
      ),
      total,
      page,
      limit,
    );
    return result;
  }

  async findExaminationResultsByUserId(
    userId: number,
    objectFilters: BodyFilterExaminationResultsDto,
  ) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    let { limit, page } = objectFilters;
    const { date, arrange, relativeId } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
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
    const result = new PaginationResultDto(
      'examination_results',
      ExaminationResultMapper.toExaminationResultResponseDtoList(
        examinationResults,
      ),
      total,
      page,
      limit,
    );
    return result;
  }

  async filterAndPagination(objectFilters: BodyFilterExaminationResultsDto) {
    let { limit, page } = objectFilters;
    const { date, arrange, relativeId } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
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
    const result = new PaginationResultDto(
      'examination_results',
      ExaminationResultMapper.toExaminationResultResponseDtoList(
        examinationResults,
      ),
      total,
      page,
      limit,
    );
    return result;
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
      .leftJoinAndSelect('doctor.specialty', 'specialty');
  }
}
