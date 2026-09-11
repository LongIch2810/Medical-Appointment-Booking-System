import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CoachProfileService } from './coach-profile.service';
import { BodyCreateCoachProfileDto } from './dto/request/bodyCreateCoachProfile.dto';
import { BodyUpdateCoachProfileDto } from './dto/request/bodyUpdateCoachProfile.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('coach-profile')
@ApiCookieAuth()
@Controller('coach-profile')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CoachProfileController {
  constructor(private readonly coachProfileService: CoachProfileService) {}

  @ApiOperation({
    summary: 'Hồ sơ huấn luyện viên AI của người dùng đang đăng nhập',
  })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COACH_PROFILE_MANAGE)
  async getMyCoachProfile(@Request() req) {
    const { userId } = req.user;
    return this.coachProfileService.getByUserId(userId);
  }

  @ApiOperation({ summary: 'Tạo hồ sơ huấn luyện viên AI' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.COACH_PROFILE_MANAGE)
  @AuditLogAction({ action: 'CREATE', entityName: 'coach-profile' })
  async createCoachProfile(
    @Request() req,
    @Body() body: BodyCreateCoachProfileDto,
  ) {
    const { userId } = req.user;
    return this.coachProfileService.create(userId, body);
  }

  @ApiOperation({ summary: 'Cập nhật hồ sơ huấn luyện viên AI' })
  @Patch()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.COACH_PROFILE_MANAGE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'coach-profile' })
  async updateCoachProfile(
    @Request() req,
    @Body() body: BodyUpdateCoachProfileDto,
  ) {
    const { userId } = req.user;
    return this.coachProfileService.update(userId, body);
  }
}
