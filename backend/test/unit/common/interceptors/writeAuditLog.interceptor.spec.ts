import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { WriteAuditLogInterceptor } from 'src/common/interceptors/writeAuditLog.interceptor';
import { AuditContextService } from 'src/modules/audit-logs/audit-context.service';
import { AuditLogsProducer } from 'src/bullmq/queues/auditLogs/auditLogs.producer';

describe('WriteAuditLogInterceptor', () => {
  let interceptor: WriteAuditLogInterceptor;
  let reflector: { getAllAndOverride: jest.Mock };
  let auditContextService: {
    run: jest.Mock;
    getStore: jest.Mock;
  };
  let auditLogsProducer: { createAuditLog: jest.Mock };

  const makeContext = (request: any, response: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    auditContextService = {
      // execute the callback synchronously and return its observable, like the real run()
      run: jest.fn((callback: () => any) => callback()),
      getStore: jest.fn().mockReturnValue(undefined),
    };
    auditLogsProducer = {
      createAuditLog: jest.fn().mockResolvedValue(undefined),
    };

    interceptor = new WriteAuditLogInterceptor(
      reflector as unknown as Reflector,
      auditContextService as unknown as AuditContextService,
      auditLogsProducer as unknown as AuditLogsProducer,
    );
  });

  it('skips auditing entirely when the handler has no @AuditLogAction metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const request = { method: 'GET', url: '/x', originalUrl: '/x', ip: '1.1.1.1', headers: {} };
    const response = { statusCode: 200 };
    const nextHandler: CallHandler = { handle: () => of('value') };

    let emitted: any;
    interceptor
      .intercept(makeContext(request, response), nextHandler)
      .subscribe((v) => (emitted = v));

    expect(emitted).toBe('value');
    expect(auditContextService.run).not.toHaveBeenCalled();
    expect(auditLogsProducer.createAuditLog).not.toHaveBeenCalled();
  });

  it('records an audit log on a successful response', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'CREATE',
      entityName: 'Appointment',
    });
    const request = {
      method: 'POST',
      url: '/api/v1/appointments',
      originalUrl: '/api/v1/appointments',
      ip: '10.0.0.1',
      headers: { 'user-agent': 'jest-agent' },
      user: { id: 42 },
    };
    const response = { statusCode: 201 };
    const nextHandler: CallHandler = { handle: () => of({ data: { id: 5 } }) };

    interceptor
      .intercept(makeContext(request, response), nextHandler)
      .subscribe(() => {
        expect(auditContextService.run).toHaveBeenCalledTimes(1);
        expect(auditLogsProducer.createAuditLog).toHaveBeenCalledTimes(1);
        const auditData = auditLogsProducer.createAuditLog.mock.calls[0][0];
        expect(auditData).toMatchObject({
          action: 'CREATE',
          entity_name: 'Appointment',
          endpoint: '/api/v1/appointments',
          method: 'POST',
          status_code: 201,
          is_success: true,
          user_agent: 'jest-agent',
          ip_address: '10.0.0.1',
          user_id: 42,
          new_data: { id: 5 },
        });
        expect(typeof auditData.duration_ms).toBe('number');
        done();
      });
  });

  it('resolves the user id from userId/sub fallbacks when id is absent', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'UPDATE',
      entityName: 'User',
    });
    const request = {
      method: 'PATCH',
      url: '/api/v1/users/1',
      originalUrl: '/api/v1/users/1',
      ip: '10.0.0.2',
      headers: {},
      user: { sub: 99 },
    };
    const response = { statusCode: 200 };
    const nextHandler: CallHandler = { handle: () => of({}) };

    interceptor
      .intercept(makeContext(request, response), nextHandler)
      .subscribe(() => {
        const auditData = auditLogsProducer.createAuditLog.mock.calls[0][0];
        expect(auditData.user_id).toBe(99);
        done();
      });
  });

  it('uses oldData/newData from the audit context store when present', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'UPDATE',
      entityName: 'Doctor',
    });
    auditContextService.getStore.mockReturnValue({
      oldData: { name: 'Old' },
      newData: { name: 'New' },
    });
    const request = {
      method: 'PUT',
      url: '/api/v1/doctors/1',
      originalUrl: '/api/v1/doctors/1',
      ip: '10.0.0.3',
      headers: {},
      user: { id: 1 },
    };
    const response = { statusCode: 200 };
    const nextHandler: CallHandler = { handle: () => of({ ignored: true }) };

    interceptor
      .intercept(makeContext(request, response), nextHandler)
      .subscribe(() => {
        const auditData = auditLogsProducer.createAuditLog.mock.calls[0][0];
        expect(auditData.old_data).toEqual({ name: 'Old' });
        expect(auditData.new_data).toEqual({ name: 'New' });
        done();
      });
  });

  it('records a failed audit log and rethrows the original error', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'DELETE',
      entityName: 'Appointment',
    });
    const request = {
      method: 'DELETE',
      url: '/api/v1/appointments/1',
      originalUrl: '/api/v1/appointments/1',
      ip: '10.0.0.4',
      headers: {},
      user: { id: 7 },
    };
    const response = { statusCode: 200 };
    const error = Object.assign(new Error('not allowed'), {
      getStatus: () => 403,
    });
    const nextHandler: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(makeContext(request, response), nextHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        expect(auditLogsProducer.createAuditLog).toHaveBeenCalledTimes(1);
        const auditData = auditLogsProducer.createAuditLog.mock.calls[0][0];
        expect(auditData).toMatchObject({
          action: 'DELETE',
          entity_name: 'Appointment',
          status_code: 403,
          is_success: false,
          error_message: 'not allowed',
          user_id: 7,
        });
        done();
      },
    });
  });

  it('defaults the failed-request status code to 500 when the error has no getStatus/status', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'DELETE',
      entityName: 'Appointment',
    });
    const request = {
      method: 'DELETE',
      url: '/api/v1/appointments/1',
      originalUrl: '/api/v1/appointments/1',
      ip: '10.0.0.5',
      headers: {},
      user: {},
    };
    const response = { statusCode: 200 };
    const error = new Error('boom');
    const nextHandler: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(makeContext(request, response), nextHandler).subscribe({
      error: () => {
        const auditData = auditLogsProducer.createAuditLog.mock.calls[0][0];
        expect(auditData.status_code).toBe(500);
        expect(auditData.user_id).toBeNull();
        done();
      },
    });
  });
});
