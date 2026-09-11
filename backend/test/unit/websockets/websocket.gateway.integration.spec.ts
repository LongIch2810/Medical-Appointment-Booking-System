import 'reflect-metadata';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { AddressInfo } from 'net';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { MessagesService } from 'src/modules/messages/messages.service';
import { SessionAuthService } from 'src/modules/auth/session-auth.service';
import { WsCookieAuthGuard } from 'src/common/guards/wsCookieAuth.guard';
import { WebsocketConnectionRateLimitService } from 'src/websockets/websocket-connection-rate-limit.service';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { WsRateLimitFilter } from 'src/websockets/ws-rate-limit.filter';
import { WsRateLimitGuard } from 'src/websockets/ws-rate-limit.guard';

function once<T>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 3_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

describe('WebsocketGateway integration', () => {
  let app: INestApplication;
  let endpoint: string;
  let clients: ClientSocket[];
  const messagesService = {
    assertChannelMember: jest.fn().mockResolvedValue(undefined),
    // Real MessagesService.saveMessage() now broadcasts `receive:message`
    // itself after persisting; since this test mocks MessagesService
    // entirely, the mock replicates that broadcast so the client-side
    // expectations below still reflect real runtime behavior.
    saveMessage: jest.fn(),
  };
  // Session revocation is simulated per-token: 'valid-token' stays valid
  // until `revokedTokens` marks it revoked, mirroring what
  // logout/logout-all/reset-password does to a real session in Redis.
  const revokedTokens = new Set<string>();
  const sessionAuthService = {
    validateAccessToken: jest.fn(async (token: string) => {
      if (token !== 'valid-token' || revokedTokens.has(token)) {
        throw new UnauthorizedException('Token không hợp lệ !');
      }
      return { userId: 7, roles: ['PATIENT'], tokenId: 't1', sessionVersion: 1 };
    }),
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ name: 'default', limit: 100, ttl: 60_000 }],
        }),
      ],
      providers: [
        WebsocketGateway,
        WsCookieAuthGuard,
        WsRateLimitGuard,
        WsRateLimitFilter,
        { provide: MessagesService, useValue: messagesService },
        { provide: SessionAuthService, useValue: sessionAuthService },
        {
          provide: WebsocketConnectionRateLimitService,
          useValue: { consume: jest.fn().mockResolvedValue({ allowed: true }) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    endpoint = `http://127.0.0.1:${address.port}`;

    const gateway = moduleRef.get(WebsocketGateway);
    messagesService.saveMessage.mockImplementation((data, userId) => {
      const message = {
        id: 99,
        content: data.content,
        sender: { id: userId },
        channel: { id: data.channel_id },
      };
      gateway.server.to(`room:${data.channel_id}`).emit('receive:message', message);
      return Promise.resolve(message);
    });
  });

  beforeEach(() => {
    clients = [];
    revokedTokens.clear();
    messagesService.assertChannelMember.mockClear();
    messagesService.saveMessage.mockClear();
    sessionAuthService.validateAccessToken.mockClear();
  });

  afterEach(() => {
    clients.forEach((client) => client.disconnect());
  });

  afterAll(async () => {
    await app.close();
  });

  function connect(token = 'valid-token') {
    const client = io(endpoint, {
      transports: ['websocket'],
      extraHeaders: { cookie: `accessToken=${encodeURIComponent(token)}` },
      forceNew: true,
      reconnection: false,
    });
    clients.push(client);
    return client;
  }

  it('rejects an invalid handshake token with ws-error', async () => {
    const client = connect('bad-token');
    const disconnected = once(client, 'disconnect');
    const error = await once<{ code: number }>(client, 'ws-error');
    expect(error.code).toBe(401);
    await disconnected;
  });

  it('authenticates, joins a channel and broadcasts a saved message', async () => {
    const client = connect();
    await once(client, 'connect');

    const joined = once<{ id: number; isSuccess: boolean }>(
      client,
      'notify:event',
    );
    client.emit('channel:join', { id: 1, data: { channel_id: 12 } });
    await expect(joined).resolves.toEqual({ id: 1, isSuccess: true });
    expect(messagesService.assertChannelMember).toHaveBeenCalledWith(7, 12);

    const received = once<{ id: number; content: string }>(
      client,
      'receive:message',
    );
    const acknowledged = once<{ id: number; isSuccess: boolean }>(
      client,
      'notify:event',
    );
    client.emit('send:message', {
      id: 2,
      data: { channel_id: 12, content: 'hello' },
    });
    await expect(received).resolves.toMatchObject({ id: 99, content: 'hello' });
    await expect(acknowledged).resolves.toEqual({ id: 2, isSuccess: true });
    expect(messagesService.saveMessage).toHaveBeenCalledWith(
      { channel_id: 12, content: 'hello' },
      7,
    );
  });

  it('rejects the next event once the session is revoked while the socket stays open', async () => {
    const client = connect();
    await once(client, 'connect');

    // Socket connected successfully while the session was still valid.
    const joined = once<{ id: number; isSuccess: boolean }>(
      client,
      'notify:event',
    );
    client.emit('channel:join', { id: 1, data: { channel_id: 12 } });
    await expect(joined).resolves.toEqual({ id: 1, isSuccess: true });

    // Simulate logout/logout-all/reset-password revoking this exact token
    // server-side (session_version bump or blacklist), without the socket
    // itself being closed.
    revokedTokens.add('valid-token');

    const rejected = once<{ code: number }>(client, 'ws-error');
    client.emit('channel:join', { id: 2, data: { channel_id: 12 } });
    const error = await rejected;
    expect(error.code).toBe(401);
    // The stale channel:join must not have reached the service layer.
    expect(messagesService.assertChannelMember).toHaveBeenCalledTimes(1);
  });

  it('emits event 429 without disconnecting the socket', async () => {
    const client = connect();
    await once(client, 'connect');
    const ready = once(client, 'notify:event');
    client.emit('channel:join', { id: 10, data: { channel_id: 12 } });
    await ready;

    const blocked = once<{
      code: number;
      errorCode: string;
      event: string;
      retryAfter: number;
    }>(client, 'ws-error');
    for (let index = 0; index < 61; index += 1) {
      client.emit('channel:leave', { channel_id: 12 });
    }

    await expect(blocked).resolves.toMatchObject({
      code: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      event: 'channel:leave',
    });
    expect(client.connected).toBe(true);
  });
});
