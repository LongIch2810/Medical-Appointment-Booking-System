import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { PERMISSIONS } from 'src/utils/constants';
import { AdminReportsService } from './admin-reports.service';
import { BodyGenerateAdminReportDto } from './dto/request/bodyGenerateAdminReport.dto';

@ApiTags('admin-reports')
@ApiCookieAuth()
@Controller('admin-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @ApiOperation({
    summary: 'Tạo báo cáo hiệu suất hệ thống AI Coach Healthy (chỉ admin)',
  })
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  @AuditLogAction({ action: 'READ', entityName: 'admin-reports' })
  async generate(@Body() body: BodyGenerateAdminReportDto) {
    return this.adminReportsService.generate(body);
  }
}
