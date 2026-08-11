import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import Role from 'src/entities/role.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RolePermissionService } from './role-permission.service';

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let rolePermissionRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    rolePermissionRepo = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        { provide: getRepositoryToken(RolePermission), useValue: rolePermissionRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(Permission), useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
  });

  describe('getPermissionsByRoles', () => {
    it('returns cached permissions without querying the repository on a cache hit', async () => {
      redisCacheService.getData.mockResolvedValue(['article:read']);

      const result = await service.getPermissionsByRoles(9, ['ADMIN']);

      expect(result).toEqual(['article:read']);
      expect(rolePermissionRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries and populates the cache with a 3600s TTL on a cache miss', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ name: 'article:read' }]),
      };
      rolePermissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPermissionsByRoles(9, ['ADMIN']);

      expect(result).toEqual(['article:read']);
      expect(redisCacheService.setData).toHaveBeenCalledWith('permissions:9', ['article:read'], 3600);
    });
  });
});
