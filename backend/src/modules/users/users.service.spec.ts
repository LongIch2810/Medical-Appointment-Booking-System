import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import User from 'src/entities/user.entity';
import Role from 'src/entities/role.entity';
import UserRole from 'src/entities/userRole.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let manager: { findOne: jest.Mock; find: jest.Mock; delete: jest.Mock; save: jest.Mock };
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
      find: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
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

      expect(redisCacheService.delData).toHaveBeenCalledWith('permissions:9');
    });
  });
});
