import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';
import { WebsocketConnectionRateLimitService } from 'src/websockets/websocket-connection-rate-limit.service';

function createClient(remoteAddress: string, forwardedFor?: string): Socket {
  return {
    conn: { remoteAddress },
    handshake: {
      address: remoteAddress,
      headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
    },
  } as unknown as Socket;
}

describe('WebsocketConnectionRateLimitService', () => {
  let increment: jest.Mock;
  let trustProxyHops: string | undefined;
  let service: WebsocketConnectionRateLimitService;

  beforeEach(() => {
    increment = jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    trustProxyHops = '0';
    service = new WebsocketConnectionRateLimitService(
      { increment } as unknown as RedisRateLimitStorage,
      {
        get: jest.fn(() => trustProxyHops),
      } as unknown as ConfigService,
    );
  });

  it('allows connections below the limit and never stores the raw IP', async () => {
    const rawIp = '203.0.113.10';

    await expect(service.consume(createClient(rawIp))).resolves.toEqual({
      allowed: true,
    });

    const key = increment.mock.calls[0][0] as string;
    expect(key).toHaveLength(64);
    expect(key).not.toContain(rawIp);
    expect(increment).toHaveBeenCalledWith(
      key,
      60_000,
      20,
      300_000,
      'ws-connection',
    );
  });

  it('ignores forwarded addresses when no proxy is trusted', async () => {
    const client = createClient('10.0.0.5', '203.0.113.10');

    await service.consume(client);
    const firstKey = increment.mock.calls[0][0];
    increment.mockClear();
    await service.consume(createClient('10.0.0.5', '198.51.100.8'));

    expect(increment.mock.calls[0][0]).toBe(firstKey);
  });

  it('uses the client address before one trusted proxy', async () => {
    trustProxyHops = '1';

    await service.consume(createClient('10.0.0.5', '203.0.113.10'));
    const firstKey = increment.mock.calls[0][0];
    increment.mockClear();
    await service.consume(createClient('10.0.0.5', '198.51.100.8'));

    expect(increment.mock.calls[0][0]).not.toBe(firstKey);
  });

  it('falls back to the remote address when the selected forwarded IP is invalid', async () => {
    trustProxyHops = '1';

    await service.consume(createClient('10.0.0.5', 'not-an-ip'));
    const invalidForwardedKey = increment.mock.calls[0][0];
    increment.mockClear();
    await service.consume(createClient('10.0.0.5'));

    expect(increment.mock.calls[0][0]).toBe(invalidForwardedKey);
  });

  it('returns the standard 429 payload when the connection is blocked', async () => {
    increment.mockResolvedValue({
      totalHits: 21,
      timeToExpire: 45,
      isBlocked: true,
      timeToBlockExpire: 287,
    });

    await expect(
      service.consume(createClient('203.0.113.10')),
    ).resolves.toEqual({
      allowed: false,
      error: {
        code: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: 287,
      },
    });
  });
});
