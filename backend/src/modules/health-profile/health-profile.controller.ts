import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { HealthProfileService } from './health-profile.service';
import { BodyFilterHealthProfilesDto } from './dto/request/bodyFilterHealthProfiles.dto';
import { BodyUpdateHealthProfileDto } from './dto/request/bodyUpdateHealthProfile.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health-profiles')
@ApiCookieAuth()
@Controller('health-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HealthProfileController {
  constructor(private readonly healthProfileService: HealthProfileService) {}

  @ApiOperation({
    summary: 'Danh sách hồ sơ sức khỏe của bệnh nhân đang đăng nhập',
  })
  @Post('patient/list')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.HEALTH_PROFILE_READ)
  async getListHealthProfilesByPersonal(
    @Request() req,
    @Body() objectFilters: BodyFilterHealthProfilesDto,
  ) {
    const { userId } = req.user;
    return this.healthProfileService.listHealthProfilesByUserId(
      userId,
      objectFilters,
    );
  }

  @ApiOperation({ summary: 'Cập nhật hồ sơ sức khỏe' })
  @Patch('update/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.HEALTH_PROFILE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'health-profiles' })
  async updateHealthProfile(
    @Request() req,
    @Param('id', ParseIntPipe) relativeId: number,
    @Body() bodyUpdateHealProfile: Partial<BodyUpdateHealthProfileDto>,
  ) {
    const { userId } = req.user;
    const updatedHealProfile = await this.healthProfileService.update(
      userId,
      relativeId,
      bodyUpdateHealProfile,
    );
    return updatedHealProfile;
  }

  @ApiOperation({ summary: 'Chi tiết hồ sơ sức khỏe theo người thân' })
  @Get(':relativeId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.HEALTH_PROFILE_READ)
  async getHealthProfileByRelativeId(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.healthProfileService.getHealthProfile(userId, relativeId);
  }

  @ApiOperation({
    summary: 'Danh sách hồ sơ sức khỏe (admin, phân trang, lọc)',
  })
  @Post('admin/list')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.HEALTH_PROFILE_MANAGE)
  async filterAndPagination(
    @Body() objectFilters: BodyFilterHealthProfilesDto,
  ) {
    return this.healthProfileService.filterAndPagination(objectFilters);
  }
}
