import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';
import { LocalAuthGuard } from 'src/common/guards/localAuth.guard';

/**
 * LocalAuthGuard is a thin `AuthGuard('local')` subclass with no overrides
 * of its own. See jwt.guard.spec.ts for why a fake Passport strategy
 * (rather than the real LocalStrategy, which depends on AuthService) is
 * used to exercise its actual canActivate() behavior.
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

describe('LocalAuthGuard', () => {
  const STRATEGY_NAME = 'local';

  afterEach(() => {
    try {
      passport.unuse(STRATEGY_NAME);
    } catch {
      // strategy not registered for this test — nothing to clean up
    }
  });

  it('returns true and attaches the authenticated user to the request when the local strategy succeeds', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({
        user: { id: 3, username: 'patient01' },
      })) as any,
    );
    const guard = new LocalAuthGuard();
    const req: any = {
      body: { usernameOrEmail: 'patient01', password: 'correct-password' },
      cookies: {},
      headers: {},
    };

    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual({ id: 3, username: 'patient01' });
  });

  it('throws UnauthorizedException when the local strategy rejects the credentials', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ user: false })) as any,
    );
    const guard = new LocalAuthGuard();
    const req: any = {
      body: { usernameOrEmail: 'patient01', password: 'wrong-password' },
      cookies: {},
      headers: {},
    };

    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propagates a custom error thrown by the strategy instead of a generic 401', async () => {
    const invalidCredsError = new UnauthorizedException(
      'Tên đăng nhập/email hoặc mật khẩu không đúng.',
    );
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ err: invalidCredsError })) as any,
    );
    const guard = new LocalAuthGuard();
    const req: any = {
      body: { usernameOrEmail: 'unknown@example.com', password: 'x' },
      cookies: {},
      headers: {},
    };

    await expect(guard.canActivate(makeContext(req))).rejects.toBe(
      invalidCredsError,
    );
  });
});
