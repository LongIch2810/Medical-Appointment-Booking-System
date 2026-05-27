import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_LOG_KEY } from '../../utils/constants';
import { AuditContextService } from '../../modules/audit-logs/audit-context.service';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuditLogsProducer } from '../../bullmq/queues/auditLogs/auditLogs.producer';
import { AuditLogData } from '../../shared/types/auditLog.type';

@Injectable()
export class WriteAuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditContextService: AuditContextService,
    private auditLogsProducer: AuditLogsProducer,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Lấy các action , entity name từ request từ decorator @AuditLogAction
    const startedAt = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const metadata = this.reflector.getAllAndOverride(AUDIT_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const userId =
      request.user?.id ?? request.user?.userId ?? request.user?.sub ?? null;
    if (!metadata) {
      return next.handle();
    }

    const { method, originalUrl, url, ip, headers } = request;
    const { action, entityName } = metadata;
    // Sau đó nhìn response lấy old data và new data rồi gọi service đưa việc ghi log vào queue để xử lý sau
    return this.auditContextService.run(() => {
      return next.handle().pipe(
        tap((responseData) => {
          const auditStore = this.auditContextService.getStore();
          const auditData: AuditLogData = {
            action,
            entity_name: entityName,
            old_data: auditStore?.oldData ?? {},
            new_data:
              auditStore?.newData ?? responseData?.data ?? responseData ?? {},
            endpoint: originalUrl ?? url,
            method,
            status_code: response.statusCode,
            is_success: response.statusCode >= 200 && response.statusCode < 400,
            error_message: undefined,
            user_agent: headers['user-agent'] ?? null,
            ip_address: ip ?? null,
            duration_ms: Date.now() - startedAt,
            user_id: userId,
          };
          this.auditLogsProducer.createAuditLog(auditData).catch(() => null);
        }),
        catchError((error) => {
          const auditStore = this.auditContextService.getStore();
          const statusCode =
            typeof error?.getStatus === 'function'
              ? error.getStatus()
              : (error?.status ?? 500);
          const auditData: AuditLogData = {
            action,
            entity_name: entityName,
            old_data: auditStore?.oldData ?? {},
            new_data: auditStore?.newData ?? {},
            endpoint: originalUrl ?? url,
            method,
            status_code: statusCode,
            is_success: false,
            error_message: error?.message ?? 'Unknown error',
            user_agent: headers['user-agent'] ?? undefined,
            ip_address: ip ?? null,
            duration_ms: Date.now() - startedAt,
            user_id: userId,
          };

          this.auditLogsProducer.createAuditLog(auditData).catch(() => null);
          return throwError(() => error);
        }),
      );
    });
  }
}
