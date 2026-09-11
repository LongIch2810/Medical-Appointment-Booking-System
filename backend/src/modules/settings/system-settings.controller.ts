import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { UpdateSystemSettingsDto } from './dto/updateSystemSettings.dto';
import { SettingsService } from './settings.service';

@ApiTags('system-settings')
@ApiCookieAuth()
@Controller('system-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SETTING_READ)
  @ApiOperation({ summary: 'Cấu hình lịch hẹn và thông báo toàn hệ thống' })
  getSettings() {
    return this.settingsService.getSystemSettings();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SETTING_MANAGE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'system_configs' })
  @ApiOperation({ summary: 'Cập nhật cấu hình toàn hệ thống' })
  updateSettings(@Body() body: UpdateSystemSettingsDto) {
    return this.settingsService.updateSystemSettings(body);
  }
}
