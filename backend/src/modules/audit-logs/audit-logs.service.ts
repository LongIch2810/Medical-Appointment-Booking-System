import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/auditLog.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { AuditLogData } from 'src/shared/types/auditLog.type';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) {}

  async create(data: AuditLogData) {
    const { user_id, ...rest } = data;
    const isExistUser = await this.usersService.isUserExists(user_id);
    if (!isExistUser) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với id ${user_id}`,
      );
    }

    const createdAuditLog = this.auditLogRepo.create({
      ...rest,
      user: { id: user_id },
    });
    const newAuditLog = await this.auditLogRepo.save(createdAuditLog);
    return newAuditLog;
  }
}
