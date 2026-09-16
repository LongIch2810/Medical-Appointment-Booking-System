import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { AuthController } from 'src/modules/auth/auth.controller';

function createMockResponse() {
  return {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
}

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    loginAdministrator: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    setNewPassword: jest.fn(),
  };
  const configService = { get: jest.fn() };
  const controller = new AuthController(
    authService as never,
    configService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockReturnValue(undefined);
  });

  it('registers a new user', async () => {
    const registerData = { email: 'a@b.com' } as never;
    authService.register.mockResolvedValue({ id: 1 });

    const result = await controller.register(registerData);

    expect(authService.register).toHaveBeenCalledWith(registerData);
    expect(result).toEqual({ id: 1 });
  });

  it('logs in, sets HttpOnly auth cookies, and does not leak tokens in the body', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const req = { body: {} } as never;
    const res = createMockResponse();

    await controller.login(req, res as never);

    expect(authService.login).toHaveBeenCalledWith(req);
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'access',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const [[body]] = res.json.mock.calls;
    expect(body.data).not.toHaveProperty('accessToken');
    expect(body.data).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(body)).not.toContain('access');
    expect(JSON.stringify(body)).not.toContain('refresh');
  });

  // Regression: these handlers use @Response() (raw Express res, no
  // `passthrough`) and previously did `return res.status(...).json(...)`,
  // which returns the Express Response object itself — a circular structure
  // (res.req.res === res, etc). Global interceptors (DateFormatInterceptor's
  // unguarded recursive walk, WriteAuditLogInterceptor) receive whatever the
  // handler returns and crashed with "Maximum call stack size exceeded" —
  // silently, since the real HTTP response was already sent by res.json()/
  // res.redirect() before that, but it corrupted every login/refresh/logout
  // audit-log entry with a false status_code 500. The fix is to not return
  // the Express response object from these handlers.
  it.each([
    'login',
    'loginAdministrator',
    'refresh',
    'logout',
    'googleAuthRedirect',
  ] as const)(
    '%s does not return the raw Express response object',
    async (method) => {
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      authService.loginAdministrator.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      authService.refresh.mockResolvedValue({
        newAccessToken: 'access',
        newRefreshToken: 'refresh',
      });
      authService.logout.mockResolvedValue({ message: 'Đăng xuất thành công' });
      const req = { body: {}, user: {} } as never;
      const res = createMockResponse();

      const result = await controller[method](req, res as never);

      expect(result).not.toBe(res);
      expect(result).toBeUndefined();
    },
  );

  it('logs in an administrator, sets HttpOnly auth cookies, and does not leak tokens in the body', async () => {
    authService.loginAdministrator.mockResolvedValue({
      accessToken: 'admin-access',
      refreshToken: 'admin-refresh',
    });
    const req = { body: {} } as never;
    const res = createMockResponse();

    await controller.loginAdministrator(req, res as never);

    expect(authService.loginAdministrator).toHaveBeenCalledWith(req);
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'admin-access',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'admin-refresh',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const [[body]] = res.json.mock.calls;
    expect(body.data).not.toHaveProperty('accessToken');
    expect(body.data).not.toHaveProperty('refreshToken');
  });

  describe('cookie security options', () => {
    it('sets secure: false in development', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      const res = createMockResponse();

      await controller.login({ body: {} } as never, res as never);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access',
        expect.objectContaining({ secure: false, sameSite: 'strict' }),
      );
    });

    it('sets secure: true in production', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'production' : undefined,
      );
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      const res = createMockResponse();

      await controller.login({ body: {} } as never, res as never);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access',
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
    });

    it('clears cookies with matching secure/sameSite options', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'production' : undefined,
      );
      authService.logout.mockResolvedValue({ message: 'Đăng xuất thành công' });
      const res = createMockResponse();

      await controller.logout({} as never, res as never);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ secure: true, sameSite: 'none' }),
      );
    });
  });

  it('refreshes tokens using the request payload and sets new cookies', async () => {
    const payload = { userId: 7 };
    const req = { user: payload } as never;
    authService.refresh.mockResolvedValue({
      newAccessToken: 'new-access',
      newRefreshToken: 'new-refresh',
    });
    const res = createMockResponse();

    await controller.refresh(req, res as never);

    expect(authService.refresh).toHaveBeenCalledWith(req, payload);
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'new-access',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new-refresh',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 200,
      success: true,
      data: { message: 'Làm mới token thành công !' },
      error: null,
    });
  });

  it('logs out, clearing auth cookies', async () => {
    authService.logout.mockResolvedValue({ message: 'Đăng xuất thành công' });
    const req = {} as never;
    const res = createMockResponse();

    await controller.logout(req, res as never);

    expect(authService.logout).toHaveBeenCalledWith(req);
    expect(res.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 200,
      success: true,
      data: { message: 'Đăng xuất thành công' },
      error: null,
    });
  });

  it('logs out of all devices and returns the service message', async () => {
    authService.logoutAll.mockResolvedValue({ message: 'Đã đăng xuất' });
    const req = {} as never;

    const result = await controller.logoutAll(req);

    expect(authService.logoutAll).toHaveBeenCalledWith(req);
    expect(result).toEqual({ message: 'Đã đăng xuất' });
  });

  it('handles the Google OAuth entrypoint as a guard-only no-op', async () => {
    await expect(controller.googleAuth()).resolves.toBeUndefined();
  });

  it('completes the Google OAuth redirect by setting cookies and redirecting to the configured frontend URL', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'g-access',
      refreshToken: 'g-refresh',
    });
    configService.get.mockReturnValue('https://frontend.example.com');
    const req = {} as never;
    const res = createMockResponse();

    await controller.googleAuthRedirect(req, res as never);

    expect(authService.login).toHaveBeenCalledWith(req);
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'g-access',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith('https://frontend.example.com');
  });

  it('falls back to the default frontend URL when unconfigured', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'g-access',
      refreshToken: 'g-refresh',
    });
    configService.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.googleAuthRedirect({} as never, res as never);

    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173');
  });

  it('sets a new password using the reset token and returns the service message', async () => {
    authService.setNewPassword.mockResolvedValue({
      message: 'Đặt lại mật khẩu thành công',
    });

    const result = await controller.setNewPassword(
      'raw-reset-token',
      'newPassword123',
    );

    expect(authService.setNewPassword).toHaveBeenCalledWith(
      'raw-reset-token',
      'newPassword123',
    );
    expect(result).toBe('Đặt lại mật khẩu thành công');
  });
});

describe('AuthController authorization metadata', () => {
  it.each([
    ['logout', PERMISSIONS.AUTH_LOGOUT],
    ['logoutAll', PERMISSIONS.AUTH_LOGOUT],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, AuthController.prototype[method]),
    ).toEqual([permission]);
  });
});
