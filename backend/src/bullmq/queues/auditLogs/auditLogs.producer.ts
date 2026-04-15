import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { jobAuditLogs } from 'src/shared/enums/jobAuditLogs';
import { AuditLogData } from 'src/shared/types/auditLog.type';

@Injectable()
export class AuditLogsProducer {
  constructor(@InjectQueue('audit-logs-queue') private readonly queue: Queue) {}
  async createAuditLog(data: AuditLogData) {
    await this.queue.add(jobAuditLogs.CREATE_AUDIT_LOG, data, {
      attempts: 1, //Thử lại 1 lần,
      removeOnFail: false, // Xóa khi gặp lỗi
    });
  }
}
