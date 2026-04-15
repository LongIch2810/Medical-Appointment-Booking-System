import { Processor, WorkerHost } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { jobAuditLogs } from 'src/shared/enums/jobAuditLogs';

@Processor('audit-logs-queue', {
  concurrency: 20,
})
export class AuditLogsProcessor extends WorkerHost {
  constructor(private readonly auditLogsService: AuditLogsService) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    if (job.name === jobAuditLogs.CREATE_AUDIT_LOG) {
      await this.auditLogsService.create(job.data);
    }
  }
}
