import { RATE_LIMIT_ERROR_CODE } from 'src/common/rate-limit/rate-limit.constants';

export interface WsRateLimitErrorPayload {
  code: 429;
  errorCode: typeof RATE_LIMIT_ERROR_CODE;
  message: string;
  event?: string;
  eventId?: number;
  retryAfter: number;
}
