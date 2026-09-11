import { WsException } from '@nestjs/websockets';
import { WsRateLimitErrorPayload } from './ws-rate-limit.types';

export class WsRateLimitException extends WsException {
  constructor(readonly payload: WsRateLimitErrorPayload) {
    super(payload);
  }
}
