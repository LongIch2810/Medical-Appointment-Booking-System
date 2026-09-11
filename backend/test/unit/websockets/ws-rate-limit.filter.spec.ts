import { ArgumentsHost } from '@nestjs/common';
import { WsRateLimitException } from 'src/websockets/ws-rate-limit.exception';
import { WsRateLimitFilter } from 'src/websockets/ws-rate-limit.filter';

describe('WsRateLimitFilter', () => {
  it('emits the rate-limit payload through ws-error', () => {
    const emit = jest.fn();
    const payload = {
      code: 429 as const,
      errorCode: 'RATE_LIMIT_EXCEEDED' as const,
      message: 'Too many requests. Please try again later.',
      event: 'send:message',
      eventId: 12,
      retryAfter: 294,
    };
    const host = {
      switchToWs: () => ({ getClient: () => ({ emit }) }),
    } as unknown as ArgumentsHost;

    new WsRateLimitFilter().catch(new WsRateLimitException(payload), host);

    expect(emit).toHaveBeenCalledWith('ws-error', payload);
  });
});
