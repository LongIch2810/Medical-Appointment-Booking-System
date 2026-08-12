import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { AuditLogsService } from './audit-logs.service';
import { BodyFilterAuditLogsDto } from './dto/request/bodyFilterAuditLogs.dto';
import { AuditLogListResponseDto } from './dto/response/auditLogResponse.dto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('audit-logs')
@ApiCookieAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: 'Danh sách nhật ký thao tác (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.AUDIT_LOG_READ)
  @AuditLogAction({ action: 'READ', entityName: 'audit-logs' })
  filterAndPagination(
    @Body() objectFilters: BodyFilterAuditLogsDto,
  ): Promise<AuditLogListResponseDto> {
    return this.auditLogsService.filterAndPagination(objectFilters);
  }
}
