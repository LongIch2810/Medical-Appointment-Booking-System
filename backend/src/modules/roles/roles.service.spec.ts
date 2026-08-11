import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Role from 'src/entities/role.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let manager: { findOne: jest.Mock; getRepository: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    manager = {
      findOne: jest.fn(),
      getRepository: jest.fn(() => ({
        find: jest.fn().mockResolvedValue([]),
        restore: jest.fn(),
        create: jest.fn((data) => data),
        save: jest.fn(),
        softDelete: jest.fn(),
      })),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: PermissionsService, useValue: { isPermissionListExist: jest.fn().mockResolvedValue(true) } },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.spyOn(service, 'getRoleDetail').mockResolvedValue({} as any);
  });

  describe('updateRolePermissions', () => {
    it('wipes the whole permissions cache, since every user with this role is affected', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });

      await service.updateRolePermissions(1, [10, 11]);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('permissions:');
    });
  });

  describe('deleteRolePermissions', () => {
    it('wipes the whole permissions cache, since every user with this role is affected', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });
      manager.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([{ id: 100, permission: { id: 10 } }]),
        softDelete: jest.fn(),
      });

      await service.deleteRolePermissions(1, [10]);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('permissions:');
    });
  });
});
