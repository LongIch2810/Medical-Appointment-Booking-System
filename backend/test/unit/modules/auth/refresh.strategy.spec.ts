import { JwtRefreshStrategy } from 'src/modules/auth/refresh.strategy';

describe('JwtRefreshStrategy', () => {
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  let sessionAuthService: { assertSessionValid: jest.Mock };
  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('refresh-secret'),
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
    };
    sessionAuthService = { assertSessionValid: jest.fn().mockResolvedValue(undefined) };
    strategy = new JwtRefreshStrategy(
      configService as never,
      sessionAuthService as never,
    );
  });

  it('fails fast at construction if REFRESH_TOKEN_SECRET is not configured (no fallback secret)', () => {
    configService.getOrThrow.mockImplementation(() => {
      throw new Error('REFRESH_TOKEN_SECRET is not configured');
    });
    expect(
      () =>
        new JwtRefreshStrategy(configService as never, sessionAuthService as never),
    ).toThrow('REFRESH_TOKEN_SECRET is not configured');
  });

  it('delegates session revocation checks to SessionAuthService and returns the full payload', async () => {
    const payload = {
      sub: 9,
      tokenId: 'tok-1',
      sessionVersion: 4,
      roles: ['PATIENT'],
    };

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 9,
      tokenId: 'tok-1',
      sessionVersion: 4,
      roles: ['PATIENT'],
    });
    expect(sessionAuthService.assertSessionValid).toHaveBeenCalledWith({
      sub: 9,
      tokenId: 'tok-1',
      sessionVersion: 4,
    });
  });

  it('propagates rejection from SessionAuthService (revoked/expired session)', async () => {
    sessionAuthService.assertSessionValid.mockRejectedValue(
      new Error('Token đã bị thu hồi !'),
    );

    await expect(
      strategy.validate({ sub: 9, tokenId: 't', sessionVersion: 1, roles: [] }),
    ).rejects.toThrow('Token đã bị thu hồi !');
  });
});
