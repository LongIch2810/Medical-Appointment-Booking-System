import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';
import { JwtRefreshAuthGuard } from 'src/common/guards/jwtRefresh.guard';

/**
 * JwtRefreshAuthGuard is a thin `AuthGuard('jwt-refresh')` subclass with no
 * overrides of its own. See jwt.guard.spec.ts for why a fake Passport
 * strategy (rather than the real, Redis-backed JwtRefreshStrategy) is used
 * to exercise its actual canActivate() behavior.
 */
class FakeStrategy {
  name: string;

  constructor(
    name: string,
    private readonly handler: (
      req: any,
      options: any,
    ) => { user?: any; info?: any; err?: any },
  ) {
    this.name = name;
  }

  authenticate(req: any, options: any) {
    const result = this.handler(req, options);
    if (result.err) {
      (this as any).error(result.err);
    } else if (result.user) {
      (this as any).success(result.user, result.info);
    } else {
      (this as any).fail(result.info, 401);
    }
  }
}

function makeContext(req: any, res: any = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtRefreshAuthGuard', () => {
  const STRATEGY_NAME = 'jwt-refresh';

  afterEach(() => {
    try {
      passport.unuse(STRATEGY_NAME);
    } catch {
      // strategy not registered for this test — nothing to clean up
    }
  });

  it('returns true and attaches the authenticated user to the request when the jwt-refresh strategy succeeds', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({
        user: {
          userId: 5,
          tokenId: 'refresh-token-id',
          sessionVersion: 2,
          appContext: 'patient',
        },
      })) as any,
    );
    const guard = new JwtRefreshAuthGuard();
    const req: any = {
      cookies: { patientRefreshToken: 'valid.refresh.token' },
      headers: { 'x-app-context': 'patient' },
    };

    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual({
      userId: 5,
      tokenId: 'refresh-token-id',
      sessionVersion: 2,
      appContext: 'patient',
    });
  });

  it('throws UnauthorizedException when the jwt-refresh strategy reports no user (missing/invalid refresh token)', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ user: false })) as any,
    );
    const guard = new JwtRefreshAuthGuard();
    const req: any = { cookies: {}, headers: {} };

    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propagates a custom error thrown by the strategy (e.g. revoked refresh session) instead of a generic 401', async () => {
    const revokedError = new UnauthorizedException(
      'Phiên đăng nhập không hợp lệ !',
    );
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ err: revokedError })) as any,
    );
    const guard = new JwtRefreshAuthGuard();
    const req: any = {
      cookies: { patientRefreshToken: 'stale.refresh.token' },
      headers: { 'x-app-context': 'patient' },
    };

    await expect(guard.canActivate(makeContext(req))).rejects.toBe(
      revokedError,
    );
  });
});
