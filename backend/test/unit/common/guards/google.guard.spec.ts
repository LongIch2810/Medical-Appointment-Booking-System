import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';
import { GoogleAuthGuard } from 'src/common/guards/google.guard';

/**
 * GoogleAuthGuard is an `AuthGuard('google')` subclass that overrides
 * `getAuthenticateOptions()` to force the Google account chooser and
 * request offline access. That override, plus the inherited canActivate()
 * behavior, is what this spec exercises. See jwt.guard.spec.ts for why a
 * fake Passport strategy (rather than the real, DB-backed GoogleStrategy)
 * is registered under the same name to drive canActivate() through real
 * `passport.authenticate()`.
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

describe('GoogleAuthGuard', () => {
  const STRATEGY_NAME = 'google';

  afterEach(() => {
    try {
      passport.unuse(STRATEGY_NAME);
    } catch {
      // strategy not registered for this test — nothing to clean up
    }
  });

  it('getAuthenticateOptions() forces the Google account chooser and requests offline access', () => {
    const guard = new GoogleAuthGuard();

    expect(guard.getAuthenticateOptions()).toEqual({
      prompt: 'select_account',
      accessType: 'offline',
    });
  });

  it('passes its custom authenticate options through to the underlying passport strategy', async () => {
    let receivedOptions: any;
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, (_req, options) => {
        receivedOptions = options;
        return { user: { userId: 1, roles: ['PATIENT'] } };
      }) as any,
    );
    const guard = new GoogleAuthGuard();
    const req: any = { cookies: {}, headers: {}, query: {} };

    await guard.canActivate(makeContext(req));

    expect(receivedOptions).toMatchObject({
      prompt: 'select_account',
      accessType: 'offline',
    });
  });

  it('returns true and attaches the authenticated user to the request when the google strategy succeeds', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({
        user: { userId: 8, roles: ['PATIENT'] },
      })) as any,
    );
    const guard = new GoogleAuthGuard();
    const req: any = { cookies: {}, headers: {}, query: {} };

    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual({ userId: 8, roles: ['PATIENT'] });
  });

  it('throws UnauthorizedException when the google strategy reports no user', async () => {
    passport.use(
      STRATEGY_NAME,
      new FakeStrategy(STRATEGY_NAME, () => ({ user: false })) as any,
    );
    const guard = new GoogleAuthGuard();
    const req: any = { cookies: {}, headers: {}, query: {} };

    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
