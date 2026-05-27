import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { BodyCreateNotificationDto } from './dto/request/bodyCreateNotification.dto';
import { BodyFilterNotificationsDto } from './dto/request/bodyFilterNotifications.dto';
import { BodyUpdateNotificationDto } from './dto/request/bodyUpdateNotification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  @AuditLogAction({ action: 'READ', entityName: 'notifications' })
  filterAndPagination(@Body() objectFilters: BodyFilterNotificationsDto) {
    return this.notificationsService.filterAndPagination(objectFilters);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.NOTIFICATION_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'notifications' })
  create(@Body() body: BodyCreateNotificationDto) {
    return this.notificationsService.create(body);
  }

  @Get(':notificationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  findById(@Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.notificationsService.findById(notificationId);
  }

  @Patch(':notificationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'notifications' })
  update(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @Body() body: BodyUpdateNotificationDto,
  ) {
    return this.notificationsService.update(notificationId, body);
  }

  @Patch(':notificationId/notified')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'notifications.notified' })
  markAsNotified(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.markAsNotified(notificationId);
  }

  @Delete(':notificationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'notifications' })
  remove(@Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.notificationsService.remove(notificationId);
  }
}
