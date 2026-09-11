import { WsCookieAuthGuard } from 'src/common/guards/wsCookieAuth.guard';

function makeContext(client: any) {
  return {
    switchToWs: () => ({
      getClient: () => client,
    }),
  } as any;
}

describe('WsCookieAuthGuard', () => {
  let sessionAuthService: { validateAccessToken: jest.Mock };
  let guard: WsCookieAuthGuard;

  beforeEach(() => {
    sessionAuthService = { validateAccessToken: jest.fn() };
    guard = new WsCookieAuthGuard(sessionAuthService as never);
  });

  it('authenticates the socket when the session is valid, storing the resolved identity', async () => {
    sessionAuthService.validateAccessToken.mockResolvedValue({
      userId: 42,
      roles: ['PATIENT'],
      tokenId: 'tok-1',
      sessionVersion: 3,
    });
    const client: any = {
      handshake: { headers: { cookie: 'accessToken=valid.jwt.token; other=1' } },
      data: {},
      emit: jest.fn(),
    };

    await expect(guard.canActivate(makeContext(client))).resolves.toBe(true);

    expect(sessionAuthService.validateAccessToken).toHaveBeenCalledWith(
      'valid.jwt.token',
    );
    expect(client.data.user).toEqual({
      sub: 42,
      roles: ['PATIENT'],
      tokenId: 'tok-1',
      sessionVersion: 3,
    });
    expect(client.data.token).toBe('valid.jwt.token');
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('decodes a URI-encoded accessToken cookie value before validating it', async () => {
    sessionAuthService.validateAccessToken.mockResolvedValue({
      userId: 1,
      roles: [],
      tokenId: 't',
      sessionVersion: 1,
    });
    const client: any = {
      handshake: {
        headers: { cookie: 'accessToken=abc%2Bdef%3Dghi' },
      },
      data: {},
      emit: jest.fn(),
    };

    await guard.canActivate(makeContext(client));

    expect(sessionAuthService.validateAccessToken).toHaveBeenCalledWith(
      'abc+def=ghi',
    );
  });

  it('rejects and emits ws-error when there is no cookie header at all', async () => {
    const client: any = {
      handshake: { headers: {} },
      data: {},
      emit: jest.fn(),
    };

    await expect(guard.canActivate(makeContext(client))).resolves.toBe(false);

    expect(sessionAuthService.validateAccessToken).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
    expect(client.data.user).toBeUndefined();
  });

  it('rejects and emits ws-error when the cookie header has no accessToken entry', async () => {
    const client: any = {
      handshake: { headers: { cookie: 'other=someValue; theme=dark' } },
      data: {},
      emit: jest.fn(),
    };

    await expect(guard.canActivate(makeContext(client))).resolves.toBe(false);

    expect(sessionAuthService.validateAccessToken).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
  });

  it('rejects and emits ws-error when the session is no longer valid (revoked/expired/blacklisted)', async () => {
    sessionAuthService.validateAccessToken.mockRejectedValue(
      new Error('jwt expired'),
    );
    const client: any = {
      handshake: { headers: { cookie: 'accessToken=expired.jwt.token' } },
      data: {},
      emit: jest.fn(),
    };

    await expect(guard.canActivate(makeContext(client))).resolves.toBe(false);

    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
    expect(client.data.user).toBeUndefined();
  });

  it('does not blow up when handshake data is entirely absent, and still rejects with ws-error', async () => {
    const client: any = {
      handshake: undefined,
      data: {},
      emit: jest.fn(),
    };

    await expect(guard.canActivate(makeContext(client))).resolves.toBe(false);

    expect(sessionAuthService.validateAccessToken).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('ws-error', {
      code: 401,
      message: 'Invalid token',
    });
  });
});
