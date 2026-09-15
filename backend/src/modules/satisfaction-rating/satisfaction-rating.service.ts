import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import SatisfactionRating from 'src/entities/satisfactionRating.entity';
import { BodyCreateSatisfactionRating } from './dto/request/bodyCreateSatisfactionRating.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentsMapper } from '../appointments/appointments.mapper';
import { RolePermissionService } from '../role-permission/role-permission.service';
import { PERMISSIONS } from 'src/utils/constants';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { BodyFilterSatisfactionRatingsDto } from './dto/request/bodyFilterSatisfactionRatings.dto';
import { BodyUpdateSatisfactionRatingDto } from './dto/request/bodyUpdateSatisfactionRating.dto';

@Injectable()
export class SatisfactionRatingService {
  constructor(
    @InjectRepository(SatisfactionRating)
    private readonly satisfactionRatingRepo: Repository<SatisfactionRating>,
    private readonly appointmentsService: AppointmentsService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly redisCacheService: RedisCacheService,
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
      await this.invalidateDoctorCaches();
      // Danh sách/chi tiết lịch hẹn nhúng sẵn satisfaction_rating để ẩn nút
      // "Đánh giá" — không xoá cache này thì bệnh nhân vẫn thấy nút đánh giá
      // (và endpoint chi tiết vẫn trả bản ghi cũ) tới khi cache hết hạn.
      await this.redisCacheService.delByPrefix('appointments:');
      await this.redisCacheService.delData(
        `user:${userId}:appointment:${appointment_id}`,
      );
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
    requesterId: number,
    requesterRoles: string[],
  ) {
    const satisfactionRating =
      await this.findRatingWithOwner(satisfactionRatingId);

    if (!satisfactionRating) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    await this.assertOwnerOrManage(
      satisfactionRating,
      requesterId,
      requesterRoles,
    );

    Object.assign(satisfactionRating, bodyUpdateSatisfactionRating);
    const updatedRating =
      await this.satisfactionRatingRepo.save(satisfactionRating);
    await this.invalidateDoctorCaches();
    return updatedRating;
  }

  async delete() {}

  async filterAndPagination(objectFilters: BodyFilterSatisfactionRatingsDto) {
    let { page, limit } = objectFilters;
    const { fromDate, toDate, doctorId, arrange } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    const query = this.satisfactionRatingRepo
      .createQueryBuilder('satisfaction_rating')
      .innerJoinAndSelect('satisfaction_rating.appointment', 'appointment')
      .innerJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule')
      .innerJoinAndSelect('doctor_schedule.doctor', 'doctor')
      .innerJoinAndSelect('doctor.user', 'doctor_user')
      .innerJoinAndSelect('appointment.patient', 'patient')
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
    // Admin FE đọc tên bác sĩ/bệnh nhân qua appointment.doctor.user.fullname
    // và appointment.patient (cùng shape AppointmentResponseDto dùng ở
    // /appointments) — trả thẳng entity lồng nhau (doctor_schedule.doctor)
    // như trước khiến FE luôn thấy "-" dù DB có dữ liệu.
    const ratingsWithMappedAppointment = satisfactionRatings.map(
      (rating) => ({
        ...rating,
        appointment: AppointmentsMapper.toAppointmentResponseDto(
          rating.appointment,
        ),
      }),
    );
    return {
      satisfactionRatings: ratingsWithMappedAppointment,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async isSatisfactionRatingExist(appointment_id: number) {
    const satisfactionRating = await this.satisfactionRatingRepo.findOne({
      where: { appointment: { id: appointment_id } },
    });
    return !!satisfactionRating;
  }

  async findById(
    satisfactionRatingId: number,
    requesterId: number,
    requesterRoles: string[],
  ) {
    const satisfactionRating = await this.satisfactionRatingRepo
      .createQueryBuilder('satisfaction_rating')
      .leftJoinAndSelect('satisfaction_rating.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patient_user')
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
        'patient_user.id',
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

    await this.assertOwnerOrManage(
      satisfactionRating,
      requesterId,
      requesterRoles,
    );

    return satisfactionRating;
  }

  /**
   * Query tối thiểu (chỉ đủ để biết chủ sở hữu qua
   * appointment.patient.user) dùng cho update() — tách khỏi findById() vì
   * findById() select thêm nhiều cột hiển thị không cần cho việc ghi.
   */
  private async findRatingWithOwner(satisfactionRatingId: number) {
    return this.satisfactionRatingRepo
      .createQueryBuilder('satisfaction_rating')
      .leftJoinAndSelect('satisfaction_rating.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('patient.user', 'patient_user')
      .where('satisfaction_rating.id = :satisfactionRatingId', {
        satisfactionRatingId,
      })
      .getOne();
  }

  /**
   * Patient chỉ được xem/cập nhật rating thuộc appointment của chính mình;
   * người có satisfaction-rating:manage (admin) không bị giới hạn ownership.
   */
  private async assertOwnerOrManage(
    satisfactionRating: SatisfactionRating,
    requesterId: number,
    requesterRoles: string[],
  ) {
    const permissions = await this.rolePermissionService.getPermissionsByRoles(
      requesterId,
      requesterRoles,
    );
    if (permissions.includes(PERMISSIONS.SATISFACTION_RATING_MANAGE)) return;

    const ownerId = satisfactionRating.appointment?.patient?.user?.id;
    if (ownerId !== requesterId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác với đánh giá này.',
      );
    }
  }

  private async invalidateDoctorCaches() {
    await Promise.all([
      this.redisCacheService.delByPrefix('doctor:'),
      this.redisCacheService.delByPrefix('doctors:'),
    ]);
  }
}
