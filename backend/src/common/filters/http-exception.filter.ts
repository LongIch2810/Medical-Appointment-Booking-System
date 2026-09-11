import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let details: string | string[] = 'Internal server error';

    // Exception không phải HttpException nghĩa là lỗi không lường trước
    // (bug thật, không phải business rule) — response vẫn trả thông điệp
    // chung chung cho client (không lộ stack trace/nội bộ), nhưng phải log
    // đầy đủ ở server, nếu không lỗi 500 sẽ hoàn toàn vô hình trong log.
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        details = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as any;

        if (Array.isArray(obj.message) && status === HttpStatus.BAD_REQUEST) {
          code = 'VALIDATION_FAILED';
          details = obj.message;
        } else {
          code = obj.code || HttpStatus[status] || 'UNKNOWN_ERROR';
          details = obj.message || obj.error || 'Bad request';
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      data: null,
      error: {
        code,
        details,
      },
    });
  }
}
