import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Param,
  ParseIntPipe,
  Request,
  Res,
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
import type { Response } from 'express';

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
  async generate(@Request() req, @Body() body: BodyGenerateAdminReportDto) {
    return this.adminReportsService.generate(req.user.userId, body);
  }

  @Get('history')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async history(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('reportType') reportType?: string,
  ) {
    return this.adminReportsService.history(
      Number(page),
      Number(limit),
      reportType,
    );
  }

  @Get('history/:id')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.adminReportsService.detail(id);
  }

  @Get('history/:id/file')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async file(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
    @Res() response: Response,
  ) {
    response.redirect(
      await this.adminReportsService.file(id, download === 'true'),
    );
  }

  @Delete('history/:id')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.adminReportsService.remove(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }
}
