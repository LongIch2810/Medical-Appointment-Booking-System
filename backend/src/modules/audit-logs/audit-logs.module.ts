import { forwardRef, Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/auditLog.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), forwardRef(() => UsersModule)],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule { }
