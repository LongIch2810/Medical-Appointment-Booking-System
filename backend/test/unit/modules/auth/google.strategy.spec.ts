import { ForbiddenException } from '@nestjs/common';
import { GoogleStrategy } from 'src/modules/auth/google.strategy';
import { ROLE_NAME } from 'src/utils/constants';

describe('GoogleStrategy', () => {
  let configService: { get: jest.Mock };
  let usersService: {
    findByUsernameOrEmail: jest.Mock;
    updateUserField: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };
  let strategy: GoogleStrategy;
  let done: jest.Mock;

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('config-value') };
    usersService = {
      findByUsernameOrEmail: jest.fn(),
      updateUserField: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = { transaction: jest.fn(), getRepository: jest.fn() };
    strategy = new GoogleStrategy(
      configService as never,
      usersService as never,
      dataSource as never,
    );
    done = jest.fn();
  });

  const profile = (email: string) => ({
    emails: [{ value: email }],
    photos: [],
    displayName: 'Test User',
  });

  // Regression: Google login goes through this strategy directly, bypassing
  // AuthService.validateUser() entirely — a locked/deactivated account could
  // still sign in as long as it used "Đăng nhập bằng Google", making the
  // admin lock/deactivate action a no-op for such accounts.
  it('rejects an existing user whose account is locked', async () => {
    usersService.findByUsernameOrEmail.mockResolvedValue({
      id: 1,
      is_locking: true,
      is_active: true,
      roles: [{ role: { role_name: ROLE_NAME.PATIENT } }],
    });

    await strategy.validate('t', 'r', profile('user@example.com'), done);

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        constructor: ForbiddenException,
        message: expect.stringContaining('đã bị khóa'),
      }),
      null,
    );
  });

  it('rejects an existing user whose account is deactivated', async () => {
    usersService.findByUsernameOrEmail.mockResolvedValue({
      id: 1,
      is_locking: false,
      is_active: false,
      roles: [{ role: { role_name: ROLE_NAME.PATIENT } }],
    });

    await strategy.validate('t', 'r', profile('user@example.com'), done);

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        constructor: ForbiddenException,
        message: expect.stringContaining('vô hiệu hóa'),
      }),
      null,
    );
  });

  it('signs in an existing, active, unlocked user normally', async () => {
    usersService.findByUsernameOrEmail.mockResolvedValue({
      id: 1,
      picture: 'https://existing.example/pic.png',
      is_locking: false,
      is_active: true,
      roles: [{ role: { role_name: ROLE_NAME.PATIENT } }],
    });

    await strategy.validate('t', 'r', profile('user@example.com'), done);

    expect(done).toHaveBeenCalledWith(null, {
      userId: 1,
      roles: [ROLE_NAME.PATIENT],
    });
  });
});
