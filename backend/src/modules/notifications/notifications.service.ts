import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import Notification from 'src/entities/notification.entity';
import { Repository } from 'typeorm';
import { BodyCreateNotificationDto } from './dto/request/bodyCreateNotification.dto';
import { BodyFilterNotificationsDto } from './dto/request/bodyFilterNotifications.dto';
import { BodyUpdateNotificationDto } from './dto/request/bodyUpdateNotification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(body: BodyCreateNotificationDto) {
    const notification = this.notificationRepo.create({
      title: body.title,
      content: body.content,
      is_notified: body.isNotified ?? false,
      user: { id: body.userId },
    });

    return this.notificationRepo.save(notification);
  }

  async filterAndPagination(objectFilters: BodyFilterNotificationsDto) {
    let { page, limit } = objectFilters;
    const { search, userId, isNotified, fromDate, toDate, arrange } =
      objectFilters;
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

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    if (isNotified !== undefined) {
      query.andWhere('notification.is_notified = :isNotified', {
        isNotified,
      });
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
      notifications,
      total,
      page,
      limit,
    );
  }

  async findById(notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại.');
    }

    return notification;
  }

  async update(notificationId: number, body: BodyUpdateNotificationDto) {
    const notification = await this.findById(notificationId);

    if (body.title !== undefined) {
      notification.title = body.title;
    }

    if (body.content !== undefined) {
      notification.content = body.content;
    }

    if (body.isNotified !== undefined) {
      notification.is_notified = body.isNotified;
    }

    return this.notificationRepo.save(notification);
  }

  async markAsNotified(notificationId: number) {
    return this.update(notificationId, { isNotified: true });
  }

  async remove(notificationId: number) {
    await this.findById(notificationId);
    await this.notificationRepo.softDelete(notificationId);
    return { message: 'Xóa thông báo thành công.' };
  }
}
