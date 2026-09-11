import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Socket } from 'socket.io';
import { WsRateLimitException } from 'src/websockets/ws-rate-limit.exception';
import { WsRateLimitGuard } from 'src/websockets/ws-rate-limit.guard';

function createContext(client: Socket, data: unknown): ExecutionContext {
  const handler = function handleSendMessage() {};
  class TestGateway {}

  return {
    getType: () => 'ws',
    getHandler: () => handler,
    getClass: () => TestGateway,
    switchToWs: () => ({
      getClient: () => client,
      getData: () => data,
      getPattern: () => 'send:message',
    }),
  } as unknown as ExecutionContext;
}

describe('WsRateLimitGuard', () => {
  let increment: jest.Mock;
  let guard: WsRateLimitGuard;

  beforeEach(async () => {
    increment = jest.fn().mockResolvedValue({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    guard = new WsRateLimitGuard(
      [
        {
          limit: 60,
          ttl: 60_000,
          blockDuration: 300_000,
        },
      ] as ThrottlerModuleOptions,
      { increment } as ThrottlerStorage,
      new Reflector(),
    );
    await guard.onModuleInit();
  });

  it('counts an event by the authenticated socket user', async () => {
    const client = {
      id: 'socket-1',
      data: { user: { sub: 7 } },
    } as unknown as Socket;

    await expect(
      guard.canActivate(createContext(client, { id: 12 })),
    ).resolves.toBe(true);

    expect(increment).toHaveBeenCalledWith(
      expect.any(String),
      60_000,
      60,
      300_000,
      'default',
    );
  });

  it('throws a 429 event error without disconnecting the socket', async () => {
    increment.mockResolvedValue({
      totalHits: 61,
      timeToExpire: 50,
      isBlocked: true,
      timeToBlockExpire: 294,
    });
    const disconnect = jest.fn();
    const client = {
      id: 'socket-1',
      data: { user: { sub: 7 } },
      disconnect,
    } as unknown as Socket;

    const activation = guard.canActivate(
      createContext(client, { id: 12, data: { content: 'hello' } }),
    );

    await expect(activation).rejects.toBeInstanceOf(WsRateLimitException);
    await expect(activation).rejects.toMatchObject({
      payload: {
        code: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        event: 'send:message',
        eventId: 12,
        retryAfter: 294,
      },
    });
    expect(disconnect).not.toHaveBeenCalled();
  });
});
