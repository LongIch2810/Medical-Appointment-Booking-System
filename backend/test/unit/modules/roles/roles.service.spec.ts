import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Role from 'src/entities/role.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { RolesService } from 'src/modules/roles/roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let roleRepo: { findOne: jest.Mock; findAndCount: jest.Mock };
  let permissionsService: { isPermissionListExist: jest.Mock };
  let manager: {
    findOne: jest.Mock;
    getRepository: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
      incr: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    roleRepo = { findOne: jest.fn(), findAndCount: jest.fn() };
    permissionsService = {
      isPermissionListExist: jest.fn().mockResolvedValue(true),
    };

    manager = {
      findOne: jest.fn(),
      save: jest.fn((_entityOrRole, data) => Promise.resolve(data ?? _entityOrRole)),
      create: jest.fn((_entity: unknown, data: unknown) => data),
      getRepository: jest.fn(() => ({
        find: jest.fn().mockResolvedValue([]),
        restore: jest.fn(),
        create: jest.fn((data) => data),
        save: jest.fn(),
        softDelete: jest.fn(),
      })),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
      getRepository: jest.fn(() => ({
        find: jest.fn().mockResolvedValue([{ user: { id: 9 } }]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: PermissionsService, useValue: permissionsService },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.spyOn(service, 'getRoleDetail').mockResolvedValue({} as any);
  });

  describe('updateRolePermissions', () => {
    it('invalidates sessions for users assigned to the role', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });

      await service.updateRolePermissions(1, [10, 11]);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'permissions:',
      );
      expect(redisCacheService.incr).toHaveBeenCalledWith('session_version:9');
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'refresh_tokens:9',
      );
    });

    it('throws NotFoundException when the role does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.updateRolePermissions(999, [10]),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(redisCacheService.delByPrefix).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the permission id list is empty', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.updateRolePermissions(1, []),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when one of the permission ids does not exist', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });
      permissionsService.isPermissionListExist.mockResolvedValue(false);

      await expect(
        service.updateRolePermissions(1, [999]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteRolePermissions', () => {
    it('invalidates sessions for users assigned to the role', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });
      manager.getRepository.mockReturnValue({
        find: jest
          .fn()
          .mockResolvedValue([{ id: 100, permission: { id: 10 } }]),
        softDelete: jest.fn(),
      });

      await service.deleteRolePermissions(1, [10]);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'permissions:',
      );
      expect(redisCacheService.incr).toHaveBeenCalledWith('session_version:9');
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'refresh_tokens:9',
      );
    });

    it('throws NotFoundException when the role does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.deleteRolePermissions(999, [10]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when a requested permission is not actually assigned to the role', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });
      manager.getRepository.mockReturnValue({
        // Requested 2 permission ids but only 1 is actually linked to the role.
        find: jest
          .fn()
          .mockResolvedValue([{ id: 100, permission: { id: 10 } }]),
        softDelete: jest.fn(),
      });

      await expect(
        service.deleteRolePermissions(1, [10, 11]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('throws ConflictException when the role name already exists', async () => {
      roleRepo.findOne.mockResolvedValueOnce({ id: 5 }); // isRoleNameExist

      await expect(
        service.create({
          role_name: 'ADMIN',
          role_code: 10001,
          description: 'desc',
          permission_ids: [1, 2],
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException when one of the permission ids does not exist', async () => {
      roleRepo.findOne.mockResolvedValue(null); // neither name nor code exists
      permissionsService.isPermissionListExist.mockResolvedValue(false);

      await expect(
        service.create({
          role_name: 'NEW_ROLE',
          role_code: 20000,
          description: 'desc',
          permission_ids: [999],
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates the role with the given permissions on success', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      manager.findOne.mockResolvedValue({
        id: 7,
        role_name: 'NEW_ROLE',
        permissions: [],
      });

      const result = await service.create({
        role_name: 'NEW_ROLE',
        role_code: 20000,
        description: 'desc',
        permission_ids: [1, 1, 2],
      } as never);

      expect(result).toBeDefined();
      expect(manager.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the role does not exist', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { description: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when renaming to a name already used by another role', async () => {
      manager.findOne.mockResolvedValue({
        id: 1,
        role_name: 'OLD_NAME',
        role_code: 10001,
      });
      const conflictQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 2 }),
      };
      manager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(conflictQb),
      });

      await expect(
        service.update(1, { role_name: 'TAKEN_NAME' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates the description without touching an unchanged role_name', async () => {
      const role = {
        id: 1,
        role_name: 'ADMIN',
        role_code: 10001,
        permissions: [],
      };
      manager.findOne.mockResolvedValue(role);

      const result = await service.update(1, { description: 'Mô tả mới' });

      expect(role.role_name).toBe('ADMIN');
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Mô tả mới' }),
      );
      expect(result).toBeDefined();
    });
  });
});
