import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import User from 'src/entities/user.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { ROLE_NAME } from 'src/utils/constants';
import { UsersService } from 'src/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let userRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let manager: {
    findOne: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
      incr: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    manager = {
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn((_entity: unknown, data: unknown) => data),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('updateRoles', () => {
    it("wipes only this user's permissions cache key", async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 9 })
        .mockResolvedValueOnce({ id: 9, roles: [] });
      manager.find.mockResolvedValue([{ id: 1 }]);

      await service.updateRoles(9, [1]);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delData).toHaveBeenCalledWith('permissions:9');
    });

    it('throws NotFoundException when the target user does not exist', async () => {
      manager.findOne.mockResolvedValueOnce(null);

      await expect(service.updateRoles(999, [1])).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when one of the requested role ids does not exist', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 9 });
      manager.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.updateRoles(9, [1, 2])).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.delete).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('throws ConflictException when the email is already used', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // isUserExistsByUsername
        .mockResolvedValueOnce({ id: 2 }); // isUserExistsByEmail

      await expect(
        service.createUser(
          manager as never,
          'newuser',
          'taken@example.com',
          'New User',
          null,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException when the username is already used', async () => {
      userRepo.findOne
        .mockResolvedValueOnce({ id: 3 }) // isUserExistsByUsername
        .mockResolvedValueOnce(null); // isUserExistsByEmail

      await expect(
        service.createUser(
          manager as never,
          'taken',
          'new@example.com',
          'New User',
          null,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the user and assigns the default PATIENT role', async () => {
      userRepo.findOne.mockResolvedValue(null);
      manager.findOne.mockResolvedValue({ id: 3, role_name: 'PATIENT' });
      manager.save.mockImplementation((_entity: unknown, data: unknown) =>
        Promise.resolve({ id: 55, ...(data as object) }),
      );

      const result = await service.createUser(
        manager as never,
        'newuser',
        'new@example.com',
        'New User',
        'hashed-pw',
      );

      expect(result).toMatchObject({
        id: 55,
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed-pw',
      });
      expect(manager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ where: { role_name: ROLE_NAME.PATIENT } }),
      );
    });

    it('throws NotFoundException when the default PATIENT role is missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      manager.findOne.mockResolvedValue(null);
      manager.save.mockImplementation((_entity: unknown, data: unknown) =>
        Promise.resolve({ id: 55, ...(data as object) }),
      );

      await expect(
        service.createUser(
          manager as never,
          'newuser',
          'new@example.com',
          'New User',
          null,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('maps a unique-constraint race on insert to a friendly ConflictException', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const pgError = Object.assign(
        new QueryFailedError('insert', [], new Error('duplicate key')),
        { driverError: { code: '23505' } },
      );
      manager.save.mockRejectedValue(pgError);

      await expect(
        service.createUser(
          manager as never,
          'newuser',
          'new@example.com',
          'New User',
          null,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getUserProfile', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped profile when the user exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 5, roles: [], fullname: 'A' });

      const result = await service.getUserProfile(5);

      expect(result.id).toBe(5);
    });
  });

  describe('setLocking', () => {
    it('throws ForbiddenException instead of locking an ADMIN account', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roles: [{ role: { role_name: 'ADMIN' } }],
      });

      await expect(service.setLocking(1, true)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('locks a non-ADMIN account and revokes their current session', async () => {
      const user = {
        id: 2,
        is_locking: false,
        roles: [{ role: { role_name: 'DOCTOR' } }],
      };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.setLocking(2, true);

      expect(user.is_locking).toBe(true);
      expect(userRepo.save).toHaveBeenCalledWith(user);
      // Regression: locking used to only flip the column — the account's
      // existing access/refresh token kept working until the access token
      // naturally expired (15 min) and could be refreshed indefinitely,
      // since nothing in the auth flow ever checked is_locking. Bumping
      // session_version (same mechanism as change-password) forces an
      // immediate re-login.
      expect(redisCacheService.incr).toHaveBeenCalledWith('session_version:2');
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'refresh_tokens:2',
      );
    });

    it('allows unlocking an ADMIN account (only locking is restricted) without touching sessions', async () => {
      const user = {
        id: 1,
        is_locking: true,
        roles: [{ role: { role_name: 'ADMIN' } }],
      };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await expect(service.setLocking(1, false)).resolves.toBeDefined();
      expect(redisCacheService.incr).not.toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('throws ForbiddenException instead of deactivating an ADMIN account', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        roles: [{ role: { role_name: 'ADMIN' } }],
      });

      await expect(service.setActive(1, false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows activating an ADMIN account without touching sessions', async () => {
      const user = {
        id: 1,
        is_active: false,
        roles: [{ role: { role_name: 'ADMIN' } }],
      };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await expect(service.setActive(1, true)).resolves.toBeDefined();
      expect(redisCacheService.incr).not.toHaveBeenCalled();
    });

    it('deactivates a non-ADMIN account and revokes their current session', async () => {
      const user = {
        id: 3,
        is_active: true,
        roles: [{ role: { role_name: 'PATIENT' } }],
      };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.setActive(3, false);

      expect(user.is_active).toBe(false);
      expect(redisCacheService.incr).toHaveBeenCalledWith('session_version:3');
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'refresh_tokens:3',
      );
    });
  });

  describe('filterAndPagination', () => {
    it('excludes patient-only accounts and applies search/role filters', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'asc',
        search: 'an',
        role_id: 2,
      } as never);

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        { patientRole: ROLE_NAME.PATIENT },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%an%' },
      );
      expect(qb.innerJoin).toHaveBeenCalledWith(
        'account.roles',
        'filterUserRole',
      );
      expect(result.total).toBe(0);
    });
  });

  describe('isUserExistsByUsername / isUserExistsByEmail', () => {
    it('returns true when a matching user is found', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.isUserExistsByUsername('admin01'),
      ).resolves.toBe(true);
    });

    it('returns false when no matching user is found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.isUserExistsByEmail('missing@example.com'),
      ).resolves.toBe(false);
    });
  });

  describe('numberOfUsersByAllRoles', () => {
    it('returns the repository count', async () => {
      userRepo.count.mockResolvedValue(42);

      await expect(service.numberOfUsersByAllRoles()).resolves.toBe(42);
    });
  });
});
