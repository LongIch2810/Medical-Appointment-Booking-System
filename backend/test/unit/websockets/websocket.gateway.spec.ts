import { WebsocketGateway } from 'src/websockets/websocket.gateway';

function createClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'socket-1',
    data: {},
    handshake: { headers: {} },
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('WebsocketGateway authorization', () => {
  let messagesService: {
    assertChannelMember: jest.Mock;
    saveMessage: jest.Mock;
  };
  let sessionAuthService: { validateAccessToken: jest.Mock };
  let connectionRateLimitService: { consume: jest.Mock };
  let gateway: WebsocketGateway;

  beforeEach(() => {
    messagesService = {
      assertChannelMember: jest.fn().mockResolvedValue(undefined),
      saveMessage: jest.fn(),
    };
    sessionAuthService = { validateAccessToken: jest.fn() };
    connectionRateLimitService = {
      consume: jest.fn().mockResolvedValue({ allowed: true }),
    };
    gateway = new WebsocketGateway(
      messagesService as never,
      sessionAuthService as never,
      connectionRateLimitService as never,
    );
  });

  it('disconnects a client that has no access token', async () => {
    const client = createClient();

    await gateway.handleConnection(client as never);

    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects a rate-limited connection before validating its session', async () => {
    const error = {
      code: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: 300,
    };
    connectionRateLimitService.consume.mockResolvedValue({
      allowed: false,
      error,
    });
    const client = createClient({
      handshake: {
        headers: { cookie: 'patientAccessToken=valid' },
        auth: { appContext: 'patient' },
      },
    });

    await gateway.handleConnection(client as never);

    expect(client.emit).toHaveBeenCalledWith('ws-error', error);
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(sessionAuthService.validateAccessToken).not.toHaveBeenCalled();
  });

  it('disconnects a client whose token fails session validation (revoked/expired)', async () => {
    sessionAuthService.validateAccessToken.mockRejectedValue(
      new Error('Token không hợp lệ !'),
    );
    const client = createClient({
      handshake: {
        headers: { cookie: 'patientAccessToken=revoked' },
        auth: { appContext: 'patient' },
      },
    });

    await gateway.handleConnection(client as never);

    expect(sessionAuthService.validateAccessToken).toHaveBeenCalledWith(
      'revoked',
      'patient',
    );
    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('accepts a client whose session validates and stores the resolved identity on the socket', async () => {
    sessionAuthService.validateAccessToken.mockResolvedValue({
      userId: 7,
      roles: ['PATIENT'],
      tokenId: 'tok-1',
      sessionVersion: 2,
      appContext: 'patient',
    });
    const client = createClient({
      handshake: {
        headers: { cookie: 'patientAccessToken=valid' },
        auth: { appContext: 'patient' },
      },
    });

    await gateway.handleConnection(client as never);

    expect(client.emit).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();
    expect((client.data as any).user).toEqual({
      sub: 7,
      roles: ['PATIENT'],
      tokenId: 'tok-1',
      sessionVersion: 2,
      appContext: 'patient',
    });
    expect(client.join).toHaveBeenCalledWith('user:7');
  });

  it('checks membership before joining a channel', async () => {
    const client = createClient({ data: { user: { sub: 7 } } });

    await gateway.handleJoinChannel(
      { id: 1, data: { channel_id: 12 } },
      client as never,
    );

    expect(messagesService.assertChannelMember).toHaveBeenCalledWith(7, 12);
    expect(client.join).toHaveBeenCalledWith('room:12');
  });

  it('binds the message sender to the authenticated socket user and acks the sender', async () => {
    const client = createClient({ data: { user: { sub: 7 } } });
    messagesService.saveMessage.mockResolvedValue({
      id: 5,
      channel: { id: 12 },
    });
    const body = {
      sender_id: 999,
      channel_id: 12,
      content: 'hello',
      message_type: 'regular',
    };

    await gateway.handleSendMessage({ id: 2, data: body }, client as never);

    expect(messagesService.saveMessage).toHaveBeenCalledWith(body, 7);
    expect(client.emit).toHaveBeenCalledWith('notify:event', {
      id: 2,
      isSuccess: true,
    });
  });

  it('applies WsCookieAuthGuard at the gateway level so every event re-checks session revocation', () => {
    const guards = Reflect.getMetadata('__guards__', WebsocketGateway) as
      unknown[] | undefined;
    const guardNames = (guards ?? []).map(
      (guard: any) => guard?.name ?? guard?.constructor?.name,
    );
    expect(guardNames).toContain('WsCookieAuthGuard');
  });

  it('uses the configured per-event rate-limit policies', () => {
    const sendMessageHandler = Object.getOwnPropertyDescriptor(
      WebsocketGateway.prototype,
      'handleSendMessage',
    )?.value as (...args: unknown[]) => unknown;

    expect(
      Reflect.getMetadata('THROTTLER:LIMITdefault', WebsocketGateway),
    ).toBe(60);
    expect(
      Reflect.getMetadata('THROTTLER:LIMITdefault', sendMessageHandler),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        'THROTTLER:BLOCK_DURATIONdefault',
        sendMessageHandler,
      ),
    ).toBe(300_000);
  });
});
