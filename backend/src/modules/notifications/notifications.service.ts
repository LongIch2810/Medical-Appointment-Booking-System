import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import Notification from 'src/entities/notification.entity';
import User from 'src/entities/user.entity';
import { NotificationType } from 'src/shared/enums/notificationType';
import { ROLE_NAME } from 'src/utils/constants';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { In, Repository } from 'typeorm';
import { BodyCreateNotificationDto } from './dto/request/bodyCreateNotification.dto';
import { BodyFilterNotificationsDto } from './dto/request/bodyFilterNotifications.dto';
import { BodyUpdateNotificationDto } from './dto/request/bodyUpdateNotification.dto';
import { QueryMyNotificationsDto } from './dto/request/queryMyNotifications.dto';
import { QueryNotificationRecipientsDto } from './dto/request/queryNotificationRecipients.dto';
import { NotificationsMapper } from './notifications.mapper';
import { UsersMapper } from '../users/users.mapper';
import { isPgDriverError } from 'src/utils/isPgDriverError';
import { toHHMM } from 'src/utils/toMinutes';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { QueryFailedError } from 'typeorm';

const ACTIVE_ADMIN_USER_IDS_CACHE_KEY = 'notifications:active-admin-user-ids';

export interface AppointmentNotificationContext {
  appointmentId: number;
  patientUserId: number;
  doctorUserId: number;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface NotificationDraft {
  userId: number;
  title: string;
  content: string;
  type: NotificationType;
  actionUrl: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: WebsocketGateway,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(body: BodyCreateNotificationDto) {
    await this.assertActiveManualRecipient(body.userId);
    const [notification] = await this.persistAndEmit([
      {
        userId: body.userId,
        title: body.title,
        content: body.content,
        type: NotificationType.MANUAL,
        actionUrl: body.actionUrl ?? null,
      },
    ]);
    return notification;
  }

  async findRecipients(filters: QueryNotificationRecipientsDto) {
    const page = Math.max(filters.page, 1);
    const limit = Math.max(filters.limit, 1);
    // innerJoin (không phải leftJoin) để chỉ liệt kê user có ít nhất 1 role,
    // khớp với điều kiện assertActiveManualRecipient() kiểm tra khi submit —
    // tránh trường hợp admin chọn một user không có role hợp lệ từ danh sách
    // rồi bị NotFoundException ngay sau đó.
    const query = this.userRepo
      .createQueryBuilder('recipient')
      .innerJoinAndSelect('recipient.roles', 'userRole')
      .innerJoinAndSelect('userRole.role', 'role')
      .where('recipient.is_active = true')
      .andWhere('recipient.is_locking = false');

    if (filters.search) {
      query.andWhere(
        '(recipient.username ILIKE :search OR recipient.email ILIKE :search OR recipient.fullname ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.roleName) {
      query
        .innerJoin('recipient.roles', 'filterUserRole')
        .innerJoin('filterUserRole.role', 'filterRole')
        .andWhere('UPPER(filterRole.role_name) = UPPER(:roleName)', {
          roleName: filters.roleName,
        });
    }

    const [users, total] = await query
      .orderBy('recipient.fullname', 'ASC')
      .addOrderBy('recipient.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginationResultDto(
      'users',
      UsersMapper.toUserListResponse(users),
      total,
      page,
      limit,
    );
  }

  async createAppointmentNotifications(
    type: NotificationType,
    context: AppointmentNotificationContext,
  ) {
    const adminUserIds = await this.findActiveAdminUserIds();
    const commonMetadata = {
      appointmentId: context.appointmentId,
      appointmentDate: context.appointmentDate,
      patientName: context.patientName,
      doctorName: context.doctorName,
      status: context.status,
      startTime: context.startTime,
      endTime: context.endTime,
    };
    const patientCopy = this.buildAppointmentCopy(type, context, false);
    const adminCopy = this.buildAppointmentCopy(type, context, true);
    const draftsByUserId = new Map<number, NotificationDraft>();

    draftsByUserId.set(context.patientUserId, {
      userId: context.patientUserId,
      ...patientCopy,
      type,
      actionUrl: '/patient/appointments',
      metadata: commonMetadata,
    });

    if (!draftsByUserId.has(context.doctorUserId)) {
      draftsByUserId.set(context.doctorUserId, {
        userId: context.doctorUserId,
        ...adminCopy,
        type,
        actionUrl: '/doctor/appointments',
        metadata: commonMetadata,
      });
    }

    adminUserIds.forEach((userId) => {
      if (draftsByUserId.has(userId)) return;
      draftsByUserId.set(userId, {
        userId,
        ...adminCopy,
        type,
        actionUrl: '/admin/appointments',
        metadata: commonMetadata,
      });
    });

    return this.persistAndEmit([...draftsByUserId.values()]);
  }

  async createAppointmentReminder(context: AppointmentNotificationContext) {
    return this.persistAndEmit([
      {
        userId: context.patientUserId,
        title: 'Nhắc lịch khám sắp tới',
        content: `Bạn có lịch khám với BS. ${context.doctorName} vào ${context.appointmentDate}, ${toHHMM(context.startTime)} - ${toHHMM(context.endTime)}.`,
        type: NotificationType.APPOINTMENT_REMINDER,
        actionUrl: '/patient/appointments',
        metadata: {
          appointmentId: context.appointmentId,
          appointmentDate: context.appointmentDate,
          startTime: context.startTime,
          endTime: context.endTime,
          doctorName: context.doctorName,
          patientName: context.patientName,
          status: context.status,
        },
        dedupeKey: `appointment-reminder:${context.appointmentId}:${context.patientUserId}`,
      },
    ]);
  }

  async filterAndPagination(objectFilters: BodyFilterNotificationsDto) {
    let { page, limit } = objectFilters;
    const { search, userId, isRead, fromDate, toDate, arrange } = objectFilters;
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);
    const skip = (page - 1) * limit;

    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .orderBy(
        'notification.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere(
        '(notification.title ILIKE :search OR notification.content ILIKE :search OR user.email ILIKE :search OR user.fullname ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (userId) query.andWhere('user.id = :userId', { userId });
    if (isRead !== undefined) {
      query.andWhere('notification.is_read = :isRead', { isRead });
    }
    if (fromDate) {
      query.andWhere('notification.created_at >= :fromDate', {
        fromDate: new Date(fromDate),
      });
    }
    if (toDate) {
      query.andWhere('notification.created_at <= :toDate', {
        toDate: new Date(toDate),
      });
    }

    const [notifications, total] = await query.getManyAndCount();
    return new PaginationResultDto(
      'notifications',
      NotificationsMapper.toResponseList(notifications),
      total,
      page,
      limit,
    );
  }

  async findMine(userId: number, filters: QueryMyNotificationsDto) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.isRead !== undefined) {
      query.andWhere('notification.is_read = :isRead', {
        isRead: filters.isRead,
      });
    }
    if (filters.type) {
      query.andWhere('notification.type = :type', { type: filters.type });
    }

    const [notifications, total] = await query.getManyAndCount();
    return new PaginationResultDto(
      'notifications',
      NotificationsMapper.toResponseList(notifications),
      total,
      page,
      limit,
    );
  }

  async unreadCount(userId: number) {
    const count = await this.notificationRepo.count({
      where: { user: { id: userId }, is_read: false },
    });
    return { count };
  }

  async findById(notificationId: number) {
    return NotificationsMapper.toResponse(
      await this.findEntityById(notificationId),
    );
  }

  async update(notificationId: number, body: BodyUpdateNotificationDto) {
    const notification = await this.findEntityById(notificationId);
    if (body.title !== undefined) notification.title = body.title;
    if (body.content !== undefined) notification.content = body.content;
    if (body.actionUrl !== undefined) notification.action_url = body.actionUrl;

    const saved = await this.notificationRepo.save(notification);
    const response = NotificationsMapper.toResponse(saved);
    this.emitSafely(() =>
      this.gateway.notifyNotificationUpdated(notification.user.id, response),
    );
    return response;
  }

  async markMineAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại.');
    }
    if (!notification.is_read) {
      notification.is_read = true;
      await this.notificationRepo.save(notification);
    }
    const response = NotificationsMapper.toResponse(notification);
    this.emitSafely(() =>
      this.gateway.notifyNotificationUpdated(userId, response),
    );
    return response;
  }

  async markAllMineAsRead(userId: number) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ is_read: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .andWhere('deleted_at IS NULL')
      .execute();
    this.emitSafely(() => this.gateway.notifyNotificationsReadAll(userId));
    return { unreadCount: 0 };
  }

  async remove(notificationId: number) {
    const notification = await this.findEntityById(notificationId);
    await this.notificationRepo.softDelete(notificationId);
    this.emitSafely(() =>
      this.gateway.notifyNotificationDeleted(
        notification.user.id,
        notificationId,
      ),
    );
    return { message: 'Xóa thông báo thành công.' };
  }

  private async persistAndEmit(drafts: NotificationDraft[]) {
    if (drafts.length === 0) return [];
    let saved: Notification[];
    try {
      saved = await this.notificationRepo.save(
        drafts.map((draft) =>
          this.notificationRepo.create({
            title: draft.title,
            content: draft.content,
            type: draft.type,
            is_read: false,
            action_url: draft.actionUrl,
            metadata: draft.metadata ?? {},
            dedupe_key: draft.dedupeKey ?? null,
            user: { id: draft.userId },
          }),
        ),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        isPgDriverError(error.driverError) &&
        error.driverError.code === '23505' &&
        error.driverError.constraint === 'IDX_notifications_dedupe_key'
      ) {
        return [];
      }
      throw error;
    }
    const hydrated = await this.notificationRepo.find({
      where: { id: In(saved.map((notification) => notification.id)) },
      relations: ['user'],
    });
    const responses = NotificationsMapper.toResponseList(hydrated);
    responses.forEach((response) => {
      this.emitSafely(() =>
        this.gateway.notifyNotificationNew(response.user!.id, response),
      );
    });
    return responses;
  }

  private emitSafely(emit: () => void) {
    try {
      emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Không thể emit thông báo realtime: ${message}`);
    }
  }

  private async findEntityById(notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại.');
    }
    return notification;
  }

  /** Query builder dùng chung cho "user đang active, không bị khóa, có role" —
   * dùng cả khi kiểm tra một user cụ thể (assertActiveManualRecipient) lẫn khi
   * liệt kê user theo role (findActiveAdminUserIds), để tiêu chí "active" chỉ
   * cần sửa ở một chỗ. */
  private activeUserWithRoleQuery() {
    return this.userRepo
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'userRole')
      .innerJoin('userRole.role', 'role')
      .where('user.is_active = true')
      .andWhere('user.is_locking = false');
  }

  private async assertActiveManualRecipient(userId: number) {
    const user = await this.activeUserWithRoleQuery()
      .andWhere('user.id = :userId', { userId })
      .getOne();
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy tài khoản đang hoạt động có vai trò hợp lệ.',
      );
    }
  }

  private async findActiveAdminUserIds() {
    const cached = await this.redisCacheService.getData<number[]>(
      ACTIVE_ADMIN_USER_IDS_CACHE_KEY,
    );
    if (cached) return cached;

    const rows = await this.activeUserWithRoleQuery()
      .select('user.id', 'id')
      .andWhere('role.role_name = :role', { role: ROLE_NAME.ADMIN })
      .distinct(true)
      .getRawMany<{ id: string }>();
    const ids = rows.map((row) => Number(row.id));
    // TTL ngắn: danh sách admin active hiếm khi đổi, nhưng vẫn tự làm mới sau
    // ít giây thay vì phải wiring invalidation cho mọi chỗ có thể đổi role/khóa
    // tài khoản admin.
    await this.redisCacheService.setData(
      ACTIVE_ADMIN_USER_IDS_CACHE_KEY,
      ids,
      30,
    );
    return ids;
  }

  private buildAppointmentCopy(
    type: NotificationType,
    context: AppointmentNotificationContext,
    isAdmin: boolean,
  ) {
    const subject = isAdmin
      ? `Lịch hẹn #${context.appointmentId} của ${context.patientName}`
      : `Lịch hẹn #${context.appointmentId}`;
    switch (type) {
      case NotificationType.APPOINTMENT_CREATED:
        return {
          title: isAdmin ? 'Có lịch hẹn mới' : 'Đặt lịch khám thành công',
          content: `${subject} với BS. ${context.doctorName} vào ngày ${context.appointmentDate} đã được tạo.`,
        };
      case NotificationType.APPOINTMENT_CANCELLED:
        return {
          title: 'Lịch hẹn đã được hủy',
          content: `${subject} vào ngày ${context.appointmentDate} đã được hủy.`,
        };
      case NotificationType.APPOINTMENT_EXPIRED:
        return {
          title: 'Lịch hẹn đã quá hạn',
          content: `${subject} vào ngày ${context.appointmentDate} đã chuyển sang trạng thái quá hạn.`,
        };
      default:
        return {
          title: 'Trạng thái lịch hẹn đã thay đổi',
          content: `${subject} đã chuyển sang trạng thái ${context.status}.`,
        };
    }
  }
}
