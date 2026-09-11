import { plainToInstance } from 'class-transformer';
import Notification from 'src/entities/notification.entity';
import { NotificationResponseDto } from './dto/response/notificationResponse.dto';

export class NotificationsMapper {
  static toResponse(notification: Notification): NotificationResponseDto {
    return plainToInstance(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  static toResponseList(
    notifications: Notification[],
  ): NotificationResponseDto[] {
    return notifications.map((notification) => this.toResponse(notification));
  }
}
