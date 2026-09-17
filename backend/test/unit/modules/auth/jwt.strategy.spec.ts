import { JwtStrategy } from 'src/modules/auth/jwt.strategy';

describe('JwtStrategy', () => {
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  let sessionAuthService: { assertSessionValid: jest.Mock };
  let strategy: JwtStrategy;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('access-secret'),
      getOrThrow: jest.fn().mockReturnValue('access-secret'),
    };
    sessionAuthService = {
      assertSessionValid: jest.fn().mockResolvedValue(undefined),
    };
    strategy = new JwtStrategy(
      configService as never,
      sessionAuthService as never,
    );
  });

  it('fails fast at construction if ACCESS_TOKEN_SECRET is not configured (no fallback secret)', () => {
    configService.getOrThrow.mockImplementation(() => {
      throw new Error('ACCESS_TOKEN_SECRET is not configured');
    });
    expect(
      () =>
        new JwtStrategy(configService as never, sessionAuthService as never),
    ).toThrow('ACCESS_TOKEN_SECRET is not configured');
  });

  it('delegates session revocation checks and returns the validated app context', async () => {
    const payload = {
      sub: 9,
      roles: ['PATIENT'],
      tokenId: 'tok-1',
      sessionVersion: 4,
      appContext: 'patient',
    };

    await expect(
      strategy.validate(
        { headers: { 'x-app-context': 'patient' } } as never,
        payload,
      ),
    ).resolves.toEqual({
      userId: 9,
      roles: ['PATIENT'],
      appContext: 'patient',
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
      strategy.validate({ headers: { 'x-app-context': 'patient' } } as never, {
        sub: 9,
        roles: [],
        tokenId: 't',
        sessionVersion: 1,
        appContext: 'patient',
      }),
    ).rejects.toThrow('Token đã bị thu hồi !');
  });
});
