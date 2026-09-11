import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_MESSAGE,
} from './rate-limit.constants';

@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(context.getType() !== 'http');
  }

  protected throwThrottlingException(): Promise<void> {
    return Promise.reject(
      new HttpException(
        {
          code: RATE_LIMIT_ERROR_CODE,
          message: RATE_LIMIT_ERROR_MESSAGE,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}
