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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { BodyCreateNotificationDto } from './dto/request/bodyCreateNotification.dto';
import { BodyFilterNotificationsDto } from './dto/request/bodyFilterNotifications.dto';
import { BodyUpdateNotificationDto } from './dto/request/bodyUpdateNotification.dto';
import { QueryMyNotificationsDto } from './dto/request/queryMyNotifications.dto';
import { QueryNotificationRecipientsDto } from './dto/request/queryNotificationRecipients.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiCookieAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Danh sách thông báo của tài khoản hiện tại' })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  findMine(@Req() req, @Query() filters: QueryMyNotificationsDto) {
    return this.notificationsService.findMine(req.user.userId, filters);
  }

  @ApiOperation({ summary: 'Số thông báo chưa đọc của tài khoản hiện tại' })
  @Get('me/unread-count')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  unreadCount(@Req() req) {
    return this.notificationsService.unreadCount(req.user.userId);
  }

  @ApiOperation({ summary: 'Đánh dấu một thông báo của tôi đã đọc' })
  @Patch('me/:notificationId/read')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  markMineAsRead(
    @Req() req,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.markMineAsRead(
      req.user.userId,
      notificationId,
    );
  }

  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo của tôi đã đọc' })
  @Patch('me/read-all')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_READ)
  markAllMineAsRead(@Req() req) {
    return this.notificationsService.markAllMineAsRead(req.user.userId);
  }

  @ApiOperation({
    summary: 'Danh sách tài khoản có thể nhận thông báo thủ công',
  })
  @Get('recipients')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_CREATE)
  findRecipients(@Query() filters: QueryNotificationRecipientsDto) {
    return this.notificationsService.findRecipients(filters);
  }

  @ApiOperation({ summary: 'Danh sách thông báo quản trị' })
  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_MANAGE)
  @AuditLogAction({ action: 'READ', entityName: 'notifications' })
  filterAndPagination(@Body() objectFilters: BodyFilterNotificationsDto) {
    return this.notificationsService.filterAndPagination(objectFilters);
  }

  @ApiOperation({ summary: 'Tạo thông báo thủ công' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.NOTIFICATION_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'notifications' })
  create(@Body() body: BodyCreateNotificationDto) {
    return this.notificationsService.create(body);
  }

  @ApiOperation({ summary: 'Chi tiết thông báo quản trị' })
  @Get(':notificationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_MANAGE)
  findById(@Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.notificationsService.findById(notificationId);
  }

  @ApiOperation({ summary: 'Cập nhật thông báo' })
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

  @ApiOperation({ summary: 'Xóa thông báo' })
  @Delete(':notificationId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.NOTIFICATION_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'notifications' })
  remove(@Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.notificationsService.remove(notificationId);
  }
}
