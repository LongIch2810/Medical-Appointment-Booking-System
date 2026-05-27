import { plainToInstance } from 'class-transformer';
import { AuditLog } from 'src/entities/auditLog.entity';
import {
  AuditLogListResponseDto,
  AuditLogResponseDto,
} from './dto/response/auditLogResponse.dto';

export interface AuditLogPaginationInput {
  auditLogs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditLogsMapper {
  static toAuditLogResponseDto(auditLog: AuditLog): AuditLogResponseDto {
    return plainToInstance(AuditLogResponseDto, auditLog, {
      excludeExtraneousValues: true,
    });
  }

  static toAuditLogListResponseDto(
    payload: AuditLogPaginationInput,
  ): AuditLogListResponseDto {
    return plainToInstance(AuditLogListResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }
}
