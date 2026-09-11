import { jobAuditLogs } from 'src/shared/enums/jobAuditLogs';
import { AuditLogsProcessor } from 'src/bullmq/queues/auditLogs/auditLogs.processor';
import { AuditLogsProducer } from 'src/bullmq/queues/auditLogs/auditLogs.producer';

describe('audit-logs queue boundary', () => {
  it('enqueues a create-audit-log job with a single bounded retry and no removal on failure', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const producer = new AuditLogsProducer(queue as never);
    const data = {
      action: 'CREATE',
      entity_name: 'User',
      old_data: {},
      new_data: { id: 1 },
      endpoint: '/api/v1/users',
      method: 'POST',
      status_code: 201,
      is_success: true,
      user_agent: 'jest',
      ip_address: '127.0.0.1',
      duration_ms: 12,
      user_id: 1,
    };

    await producer.createAuditLog(data);

    expect(queue.add).toHaveBeenCalledWith(
      jobAuditLogs.CREATE_AUDIT_LOG,
      data,
      expect.objectContaining({
        attempts: 2,
        removeOnFail: false,
      }),
    );
  });

  it('dispatches create-audit-log jobs to AuditLogsService', async () => {
    const auditLogsService = { create: jest.fn() };
    const processor = new AuditLogsProcessor(auditLogsService as never);
    const data = { action: 'CREATE' };

    await processor.process({
      name: jobAuditLogs.CREATE_AUDIT_LOG,
      data,
    } as never);

    expect(auditLogsService.create).toHaveBeenCalledWith(data);
  });

  it('ignores unknown job names without creating an audit log', async () => {
    const auditLogsService = { create: jest.fn() };
    const processor = new AuditLogsProcessor(auditLogsService as never);

    await processor.process({ name: 'unknown', data: {} } as never);

    expect(auditLogsService.create).not.toHaveBeenCalled();
  });
});
