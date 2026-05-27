import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/auditLog.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { AuditLogData } from 'src/shared/types/auditLog.type';
import { BodyFilterAuditLogsDto } from './dto/request/bodyFilterAuditLogs.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { AuditLogListResponseDto } from './dto/response/auditLogResponse.dto';
import { AuditLogsMapper } from './audit-logs.mapper';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) {}

  async create(data: AuditLogData) {
    const { user_id, ...rest } = data;
    if (user_id) {
      const isExistUser = await this.usersService.isUserExists(user_id);
      if (!isExistUser) {
        throw new NotFoundException(
          `Không tìm thấy người dùng với id ${user_id}`,
        );
      }
    }

    const createdAuditLog = this.auditLogRepo.create({
      ...rest,
      user: user_id ? { id: user_id } : null,
    });
    const newAuditLog = await this.auditLogRepo.save(createdAuditLog);
    return newAuditLog;
  }

  async filterAndPagination(
    objectFilters: BodyFilterAuditLogsDto,
  ): Promise<AuditLogListResponseDto> {
    let { page, limit } = objectFilters;
    const {
      search,
      action,
      entityName,
      userId,
      method,
      isSuccess,
      fromDate,
      toDate,
      arrange,
    } = objectFilters;

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);
    const skip = (page - 1) * limit;

    const query = this.auditLogRepo
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere(
        `(auditLog.action ILIKE :search OR auditLog.entity_name ILIKE :search OR auditLog.endpoint ILIKE :search OR auditLog.method ILIKE :search OR auditLog.error_message ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (action) {
      query.andWhere('auditLog.action = :action', { action });
    }

    if (entityName) {
      query.andWhere('auditLog.entity_name ILIKE :entityName', {
        entityName: `%${entityName}%`,
      });
    }

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    if (method) {
      query.andWhere('auditLog.method = :method', {
        method: method.toUpperCase(),
      });
    }

    if (isSuccess !== undefined) {
      query.andWhere('auditLog.is_success = :isSuccess', { isSuccess });
    }

    if (fromDate) {
      query.andWhere('auditLog.created_at >= :fromDate', {
        fromDate: new Date(fromDate),
      });
    }

    if (toDate) {
      query.andWhere('auditLog.created_at <= :toDate', {
        toDate: new Date(toDate),
      });
    }

    const [auditLogs, total] = await query.getManyAndCount();
    const result = new PaginationResultDto(
      'auditLogs',
      auditLogs,
      total,
      page,
      limit,
    );
    return AuditLogsMapper.toAuditLogListResponseDto({
      auditLogs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
}
