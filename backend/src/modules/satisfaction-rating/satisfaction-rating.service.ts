import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import SatisfactionRating from 'src/entities/satisfactionRating.entity';
import { BodyCreateSatisfactionRating } from './dto/request/bodyCreateSatisfactionRating.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { BodyFilterSatisfactionRatingsDto } from './dto/request/bodyFilterSatisfactionRatings.dto';
import { BodyUpdateSatisfactionRatingDto } from './dto/request/bodyUpdateSatisfactionRating.dto';

@Injectable()
export class SatisfactionRatingService {
  constructor(
    @InjectRepository(SatisfactionRating)
    private readonly satisfactionRatingRepo: Repository<SatisfactionRating>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async create(userId: number, body: BodyCreateSatisfactionRating) {
    try {
      const { rating_score, feedback, appointment_id } = body;
      const isAppointmentsExistCompletedAndResult =
        await this.appointmentsService.isAppointmentExistsCompletedAndResult(
          userId,
          appointment_id,
        );
      if (!isAppointmentsExistCompletedAndResult) {
        throw new BadRequestException(
          `Cuộc hẹn khám ${appointment_id} không tồn tại hoặc chưa hoàn thành hoặc chưa có kết quả khám.`,
        );
      }
      const isSatisfactionRatingExist =
        await this.isSatisfactionRatingExist(appointment_id);
      if (isSatisfactionRatingExist) {
        throw new ConflictException(
          `Cuộc hẹn khám ${appointment_id} đã có đánh giá.`,
        );
      }
      const createdSatisfactionRating = this.satisfactionRatingRepo.create({
        rating_score,
        feedback,
        appointment: { id: appointment_id },
      });
      await this.satisfactionRatingRepo.save(createdSatisfactionRating);
      return { message: 'Đã hoàn thành đánh giá.' };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException(
          `Cuộc hẹn khám ${body.appointment_id} đã có đánh giá.`,
        );
      }
      throw error;
    }
  }

  async update(
    satisfactionRatingId: number,
    bodyUpdateSatisfactionRating: BodyUpdateSatisfactionRatingDto,
  ) {
    const satisfactionRating = await this.satisfactionRatingRepo.findOne({
      where: { id: satisfactionRatingId },
    });

    if (!satisfactionRating) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    Object.assign(satisfactionRating, bodyUpdateSatisfactionRating);
    return this.satisfactionRatingRepo.save(satisfactionRating);
  }

  async delete() {}

  async filterAndPagination(objectFilters: BodyFilterSatisfactionRatingsDto) {
    let { fromDate, toDate, doctorId, arrange, page, limit } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    const query = this.satisfactionRatingRepo
      .createQueryBuilder('satisfaction_rating')
      .innerJoinAndSelect('satisfaction_rating.appointment', 'appointment')
      .innerJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule')
      .innerJoinAndSelect('doctor_schedule.doctor', 'doctor')
      .orderBy(
        'satisfaction_rating.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);
    if (fromDate) {
      query.andWhere('satisfaction_rating.created_at >= :fromDate', {
        fromDate,
      });
    }
    if (toDate) {
      const toDateWithTime = new Date(toDate);
      toDateWithTime.setHours(23, 59, 59, 999);
      query.andWhere('satisfaction_rating.created_at <= :toDate', {
        toDate: toDateWithTime,
      });
    }
    if (doctorId) {
      query.andWhere('doctor.id = :doctorId', { doctorId });
    }
    const [satisfactionRatings, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return { satisfactionRatings, total, page, limit, totalPages };
  }

  async isSatisfactionRatingExist(appointment_id: number) {
    const satisfactionRating = await this.satisfactionRatingRepo.findOne({
      where: { appointment: { id: appointment_id } },
    });
    return !!satisfactionRating;
  }

  async findById(satisfactionRatingId: number) {
    const satisfactionRating = await this.satisfactionRatingRepo
      .createQueryBuilder('satisfaction_rating')
      .leftJoinAndSelect('satisfaction_rating.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule')
      .leftJoinAndSelect('doctor_schedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctor_user')
      .select([
        'satisfaction_rating.id',
        'satisfaction_rating.rating_score',
        'satisfaction_rating.feedback',
        'satisfaction_rating.created_at',
        'appointment.id',
        'appointment.appointment_date',
        'appointment.status',
        'patient.id',
        'patient.fullname',
        'doctor.id',
        'doctor_user.fullname',
      ])
      .where('satisfaction_rating.id = :satisfactionRatingId', {
        satisfactionRatingId,
      })
      .getOne();

    if (!satisfactionRating) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    return satisfactionRating;
  }
}
