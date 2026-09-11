import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { UpdateUserSettingsDto } from './dto/updateUserSettings.dto';
import { SettingsService } from './settings.service';

@ApiTags('user-settings')
@ApiCookieAuth()
@Controller('user-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SETTING_READ)
  @ApiOperation({ summary: 'Cài đặt của tài khoản hiện tại' })
  getMine(@Req() req) {
    return this.settingsService.getMySettings(req.user.userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.SETTING_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'user_settings' })
  @ApiOperation({ summary: 'Cập nhật cài đặt của tài khoản hiện tại' })
  updateMine(@Req() req, @Body() body: UpdateUserSettingsDto) {
    return this.settingsService.updateMySettings(req.user.userId, body);
  }
}
