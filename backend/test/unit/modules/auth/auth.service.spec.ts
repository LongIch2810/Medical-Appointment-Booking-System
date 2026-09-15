import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { DataSource } from 'typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { AuthService } from 'src/modules/auth/auth.service';
import ResetToken from 'src/entities/resetToken.entity';
import User from 'src/entities/user.entity';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';
import { hashSecret } from 'src/utils/hashSecret';

function makeTransactionManager(options: {
  resetTokenRow: unknown;
  updateAffected: number;
}) {
  const resetTokenQb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: options.updateAffected }),
  };
  const resetTokenRepo = {
    findOne: jest.fn().mockResolvedValue(options.resetTokenRow),
    createQueryBuilder: jest.fn().mockReturnValue(resetTokenQb),
  };
  const userRepo = { update: jest.fn().mockResolvedValue(undefined) };
  return {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === ResetToken) return resetTokenRepo;
      if (entity === User) return userRepo;
      throw new Error('Unexpected entity requested from transaction manager');
    }),
    resetTokenRepo,
    resetTokenQb,
    userRepo,
  };
}

describe('AuthService', () => {
  let usersService: {
    findByUsernameOrEmail: jest.Mock;
    updateUserField: jest.Mock;
    createUserWithDefaultProfile: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; decode: jest.Mock };
  let redisService: {
    getData: jest.Mock;
    setData: jest.Mock;
    lRange: jest.Mock;
    lPop: jest.Mock;
    rPush: jest.Mock;
    incr: jest.Mock;
    delData: jest.Mock;
    lRem: jest.Mock;
  };
  let emailProducer: { sendWelcome: jest.Mock };
  let configService: { get: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByUsernameOrEmail: jest.fn(),
      updateUserField: jest.fn(),
      createUserWithDefaultProfile: jest.fn(),
    };
    jwtService = { sign: jest.fn(), decode: jest.fn() };
    redisService = {
      getData: jest.fn(),
      setData: jest.fn(),
      lRange: jest.fn().mockResolvedValue([]),
      lPop: jest.fn(),
      rPush: jest.fn(),
      incr: jest.fn(),
      delData: jest.fn(),
      lRem: jest.fn(),
    };
    emailProducer = { sendWelcome: jest.fn() };
    configService = { get: jest.fn((key: string) => `test-${key}`) };
    dataSource = { transaction: jest.fn() };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      redisService as unknown as RedisCacheService,
      emailProducer as unknown as EmailProducer,
      configService as unknown as ConfigService,
      dataSource as unknown as DataSource,
    );
  });

  describe('validateUser', () => {
    it('returns null when the account does not exist', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('missing@example.com', 'password'),
      ).resolves.toBeNull();
    });

    it('returns a clear unauthorized error for a Google-only account', async () => {
      usersService.findByUsernameOrEmail.mockResolvedValue({
        id: 1,
        password: null,
        roles: [],
      });

      await expect(
        service.validateUser('google@example.com', 'password'),
      ).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: expect.stringContaining('Tài khoản này được tạo bằng Google'),
      });
    });

    it('returns null when the password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByUsernameOrEmail.mockResolvedValue({
        id: 1,
        password: passwordHash,
        roles: [],
      });

      await expect(
        service.validateUser('user@example.com', 'wrong-password'),
      ).resolves.toBeNull();
    });

    it('returns the user payload when the password is correct', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByUsernameOrEmail.mockResolvedValue({
        id: 7,
        password: passwordHash,
        roles: [{ role: { role_name: 'patient' } }],
      });

      await expect(
        service.validateUser('user@example.com', 'correct-password'),
      ).resolves.toEqual({ userId: 7, roles: ['patient'] });
    });
  });

  describe('login', () => {
    it('throws ForbiddenException when the authenticated user does not hold the PATIENT role', async () => {
      const req = {
        user: { userId: 5, roles: ['DOCTOR'] },
      } as any;

      await expect(service.login(req)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(redisService.setData).not.toHaveBeenCalled();
    });

    it('issues tokens, persists the session, and marks the user active for a PATIENT login', async () => {
      redisService.getData.mockResolvedValue(2);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      jwtService.decode.mockReturnValue({ exp: 1_700_000_000 });

      const req = {
        user: { userId: 5, roles: ['PATIENT'] },
        headers: { 'user-agent': 'jest-agent' },
        ip: '127.0.0.1',
      } as any;

      const result = await service.login(req);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(redisService.setData).toHaveBeenCalledWith(
        'session_version:5',
        2,
      );
      expect(redisService.rPush).toHaveBeenCalledWith(
        'refresh_tokens:5',
        expect.stringContaining('"userAgent":"jest-agent"'),
      );
      expect(usersService.updateUserField).not.toHaveBeenCalled();
      expect(redisService.lPop).not.toHaveBeenCalled();
    });

    it('evicts and blacklists the oldest session once more than 3 sessions exist', async () => {
      redisService.getData.mockResolvedValue(1);
      jwtService.sign.mockReturnValue('token');
      jwtService.decode.mockReturnValue({ exp: 1_700_000_000 });
      const oldest = JSON.stringify({ tokenId: 'old-token', exp: 1_600_000_000 });
      redisService.lRange.mockResolvedValue([oldest, 's2', 's3', 's4']);

      const req = {
        user: { userId: 5, roles: ['PATIENT'] },
        headers: {},
        ip: '127.0.0.1',
      } as any;

      await service.login(req);

      expect(redisService.lPop).toHaveBeenCalledWith('refresh_tokens:5');
      expect(redisService.setData).toHaveBeenCalledWith(
        'blacklist:old-token',
        true,
        expect.any(Number),
      );
    });
  });

  describe('loginAdministrator', () => {
    it('throws ForbiddenException when the user only holds the PATIENT role', async () => {
      const req = { user: { userId: 5, roles: ['PATIENT'] } } as any;

      await expect(service.loginAdministrator(req)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows a DOCTOR login and issues tokens', async () => {
      redisService.getData.mockResolvedValue(null);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      jwtService.decode.mockReturnValue({ exp: 1_700_000_000 });

      const req = {
        user: { userId: 8, roles: ['DOCTOR'] },
        headers: {},
        ip: '127.0.0.1',
      } as any;

      const result = await service.loginAdministrator(req);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      // No cached session_version -> defaults to 1, not the falsy null.
      expect(redisService.setData).toHaveBeenCalledWith(
        'session_version:8',
        1,
      );
    });

    it('allows a user holding PATIENT plus another role', async () => {
      redisService.getData.mockResolvedValue(1);
      jwtService.sign.mockReturnValue('token');
      jwtService.decode.mockReturnValue({ exp: 1_700_000_000 });

      const req = {
        user: { userId: 9, roles: ['PATIENT', 'DOCTOR'] },
        headers: {},
        ip: '127.0.0.1',
      } as any;

      await expect(service.loginAdministrator(req)).resolves.toBeDefined();
    });
  });

  describe('register', () => {
    it('creates the default profile, sends the welcome email, and returns the mapped user', async () => {
      const createdUser = {
        id: 42,
        username: 'newuser',
        email: 'newuser@example.com',
        fullname: 'New User',
        roles: [],
      };
      usersService.createUserWithDefaultProfile.mockResolvedValue(
        createdUser,
      );
      dataSource.transaction.mockImplementation((cb: any) => cb({}));

      const result = await service.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Secret@123',
        fullname: 'New User',
      } as any);

      expect(usersService.createUserWithDefaultProfile).toHaveBeenCalledWith(
        {},
        'newuser',
        'newuser@example.com',
        'New User',
        expect.any(String),
      );
      expect(emailProducer.sendWelcome).toHaveBeenCalledWith(
        'newuser@example.com',
        'newuser',
      );
      expect(result).toMatchObject({ id: 42, email: 'newuser@example.com' });
    });

    it('propagates errors thrown inside the transaction without sending the welcome email', async () => {
      dataSource.transaction.mockImplementation(() => {
        throw new Error('db failure');
      });

      await expect(
        service.register({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'Secret@123',
          fullname: 'New User',
        } as any),
      ).rejects.toThrow('db failure');
      expect(emailProducer.sendWelcome).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('throws UnauthorizedException when the refresh token cookie cannot be decoded', async () => {
      jwtService.decode.mockReturnValue(null);
      const req = { cookies: { refreshToken: 'bad-token' } } as any;

      await expect(service.logout(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the token is not among the stored sessions', async () => {
      jwtService.decode.mockReturnValue({
        sub: 5,
        tokenId: 'tok-1',
        exp: 1_700_000_000,
      });
      redisService.lRange.mockResolvedValue([]);
      const req = { cookies: { refreshToken: 'refresh' } } as any;

      await expect(service.logout(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('blacklists the token and removes the session', async () => {
      jwtService.decode.mockReturnValue({
        sub: 5,
        tokenId: 'tok-1',
        exp: 1_700_000_000,
      });
      const stored = JSON.stringify({ tokenId: 'tok-1' });
      redisService.lRange.mockResolvedValue([stored]);
      const req = { cookies: { refreshToken: 'refresh' } } as any;

      const result = await service.logout(req);

      expect(redisService.setData).toHaveBeenCalledWith(
        'blacklist:tok-1',
        true,
        expect.any(Number),
      );
      expect(redisService.lRem).toHaveBeenCalledWith(
        'refresh_tokens:5',
        0,
        stored,
      );
      expect(usersService.updateUserField).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Đăng xuất thành công!' });
    });
  });

  describe('logoutAll', () => {
    it('throws UnauthorizedException when the refresh token cookie cannot be decoded', async () => {
      jwtService.decode.mockReturnValue(undefined);
      const req = { cookies: { refreshToken: 'bad-token' } } as any;

      await expect(service.logoutAll(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('bumps the session version and clears every stored session', async () => {
      jwtService.decode.mockReturnValue({ sub: 5, tokenId: 'tok-1' });
      const req = { cookies: { refreshToken: 'refresh' } } as any;

      const result = await service.logoutAll(req);

      expect(redisService.incr).toHaveBeenCalledWith('session_version:5');
      expect(redisService.delData).toHaveBeenCalledWith('refresh_tokens:5');
      expect(usersService.updateUserField).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Đăng xuất tất cả các thiết bị thành công!',
      });
    });
  });

  describe('refresh', () => {
    const payload = {
      userId: 5,
      tokenId: 'tok-1',
      sessionVersion: 3,
      roles: ['PATIENT'],
    };

    it('throws UnauthorizedException when the token is blacklisted', async () => {
      redisService.getData.mockResolvedValue(true);
      const req = { headers: {}, ip: '127.0.0.1' } as any;

      await expect(service.refresh(req, payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the token is not among the stored sessions', async () => {
      redisService.getData.mockResolvedValue(null);
      redisService.lRange.mockResolvedValue([]);
      const req = { headers: {}, ip: '127.0.0.1' } as any;

      await expect(service.refresh(req, payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates the refresh token: removes the old session and issues a new one', async () => {
      redisService.getData.mockResolvedValue(null);
      const stored = JSON.stringify({ tokenId: 'tok-1', exp: 1_700_000_000 });
      redisService.lRange.mockResolvedValue([stored]);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      jwtService.decode.mockReturnValue({ exp: 1_700_100_000 });

      const req = { headers: { 'user-agent': 'jest' }, ip: '127.0.0.1' } as any;

      const result = await service.refresh(req, payload);

      expect(result).toEqual({
        newAccessToken: 'new-access-token',
        newRefreshToken: 'new-refresh-token',
      });
      expect(redisService.lRem).toHaveBeenCalledWith(
        'refresh_tokens:5',
        0,
        stored,
      );
      expect(redisService.setData).toHaveBeenCalledWith(
        'blacklist:tok-1',
        true,
        expect.any(Number),
      );
      expect(redisService.rPush).toHaveBeenCalledWith(
        'refresh_tokens:5',
        expect.stringContaining('"userAgent":"jest"'),
      );
    });
  });

  describe('setNewPassword', () => {
    it('rejects an empty/missing reset token', async () => {
      await expect(
        service.setNewPassword('', 'NewSecret@123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects when no reset token row matches the hash (invalid token)', async () => {
      const manager = makeTransactionManager({
        resetTokenRow: null,
        updateAffected: 0,
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(
        service.setNewPassword('bogus-token', 'NewSecret@123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(manager.userRepo.update).not.toHaveBeenCalled();
    });

    it('rejects an expired reset token', async () => {
      const manager = makeTransactionManager({
        resetTokenRow: {
          id: 1,
          purpose: OtpPurpose.PASSWORD_RESET,
          expiresAt: new Date(Date.now() - 1_000),
          user: { id: 5 },
        },
        updateAffected: 0,
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(
        service.setNewPassword('expired-token', 'NewSecret@123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(manager.resetTokenQb.execute).not.toHaveBeenCalled();
    });

    it('rejects a reset token already consumed by a concurrent request (replay)', async () => {
      const manager = makeTransactionManager({
        resetTokenRow: {
          id: 1,
          purpose: OtpPurpose.PASSWORD_RESET,
          expiresAt: new Date(Date.now() + 60_000),
          user: { id: 5 },
        },
        updateAffected: 0, // WHERE consumed_at IS NULL matched nothing — already consumed
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(
        service.setNewPassword('reused-token', 'NewSecret@123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(manager.userRepo.update).not.toHaveBeenCalled();
    });

    it('atomically consumes the token, hashes and stores the new password, then invalidates every existing session', async () => {
      const manager = makeTransactionManager({
        resetTokenRow: {
          id: 1,
          purpose: OtpPurpose.PASSWORD_RESET,
          expiresAt: new Date(Date.now() + 60_000),
          user: { id: 5 },
        },
        updateAffected: 1,
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      const result = await service.setNewPassword(
        'valid-token',
        'NewSecret@123',
      );

      expect(manager.resetTokenRepo.findOne).toHaveBeenCalledWith({
        where: { tokenHash: hashSecret('valid-token') },
        relations: ['user'],
      });
      expect(manager.resetTokenQb.where).toHaveBeenCalledWith(
        'id = :id AND consumed_at IS NULL',
        { id: 1 },
      );
      expect(manager.userRepo.update).toHaveBeenCalledWith(
        5,
        { password: expect.any(String) },
      );
      const [, { password: storedHash }] = manager.userRepo.update.mock.calls[0];
      await expect(
        bcrypt.compare('NewSecret@123', storedHash as string),
      ).resolves.toBe(true);
      expect(redisService.incr).toHaveBeenCalledWith('session_version:5');
      expect(redisService.delData).toHaveBeenCalledWith('refresh_tokens:5');
      expect(result).toEqual({ message: 'Đặt lại mật khẩu thành công.' });
    });
  });
});
