import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

/**
 * JwtAuthGuard is a thin `AuthGuard('jwt')` subclass with no overrides of
 * its own — all of its real behavior comes from the Passport mixin that
 * `@nestjs/passport`'s `AuthGuard()` produces (see
 * node_modules/@nestjs/passport/dist/auth.guard.js). To exercise that
 * behavior without booting the real JwtStrategy (Redis-backed, out of
 * scope for this guard's unit), we register a minimal fake Passport
 * strategy under the same name ('jwt') and drive canActivate() through
 * real `passport.authenticate()`.
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

describe('JwtAuthGuard', () => {
  const STRATEGY_NAME = 'jwt';

  afterEach(() => {
    try {
      passport.unuse(STRATEGY_NAME);
    } catch {
      // strategy not registered for this test — nothing to clean up
    }
  });

  it('returns true and attaches the authenticated user to the request when the jwt strategy succeeds', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({
        user: { userId: 1, roles: ['PATIENT'] },
      })) as any,
    );
    const guard = new JwtAuthGuard();
    const req: any = { cookies: { accessToken: 'valid.jwt.token' }, headers: {} };

    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual({ userId: 1, roles: ['PATIENT'] });
  });

  it('throws UnauthorizedException when the jwt strategy reports no user (missing/invalid token)', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ user: false })) as any,
    );
    const guard = new JwtAuthGuard();
    const req: any = { cookies: {}, headers: {} };

    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propagates a custom error thrown by the strategy (e.g. revoked/blacklisted token) instead of a generic 401', async () => {
    const revokedError = new UnauthorizedException('Token đã bị thu hồi !');
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ err: revokedError })) as any,
    );
    const guard = new JwtAuthGuard();
    const req: any = { cookies: { accessToken: 'revoked.jwt.token' }, headers: {} };

    await expect(guard.canActivate(makeContext(req))).rejects.toBe(revokedError);
  });
});
