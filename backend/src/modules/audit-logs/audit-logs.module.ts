import { forwardRef, Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/entities/auditLog.entity';
import { UsersModule } from '../users/users.module';
import { AuditContextService } from './audit-context.service';
import { BullmqModule } from '../../bullmq/bullmq.module';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    forwardRef(() => UsersModule),
    forwardRef(() => BullmqModule),
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditContextService],
  exports: [AuditLogsService, AuditContextService],
})
export class AuditLogsModule {}
