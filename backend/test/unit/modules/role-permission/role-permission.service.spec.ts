import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import Role from 'src/entities/role.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RolePermissionService } from 'src/modules/role-permission/role-permission.service';

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let rolePermissionRepo: { createQueryBuilder: jest.Mock };
  let roleRepo: { find: jest.Mock };
  let permissionRepo: { find: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    rolePermissionRepo = { createQueryBuilder: jest.fn() };
    roleRepo = { find: jest.fn() };
    permissionRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepo,
        },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: getRepositoryToken(Permission), useValue: permissionRepo },
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.setData).toHaveBeenCalledWith(
        'permissions:9',
        ['article:read'],
        3600,
      );
    });
  });

  describe('getMatrix', () => {
    it('builds the matrix and excludes soft-deleted role-permission links', async () => {
      roleRepo.find.mockResolvedValue([
        {
          id: 1,
          role_name: 'ADMIN',
          description: 'Quản trị viên',
          role_code: '10001',
          permissions: [
            { deleted_at: null, permission: { id: 10 } },
            { deleted_at: new Date(), permission: { id: 11 } },
            { deleted_at: null, permission: { id: 12 } },
          ],
        },
      ]);
      permissionRepo.find.mockResolvedValue([
        { id: 10, name: 'article:read' },
        { id: 11, name: 'article:update' },
        { id: 12, name: 'user:manage' },
      ]);

      const result = await service.getMatrix();

      expect(result.roles).toEqual([
        expect.objectContaining({
          id: 1,
          role_name: 'ADMIN',
          permission_ids: [10, 12],
        }),
      ]);
      expect(result.permissions).toEqual([
        { id: 10, name: 'article:read' },
        { id: 11, name: 'article:update' },
        { id: 12, name: 'user:manage' },
      ]);
    });

    it('returns an empty permission_ids array when a role has no permissions relation loaded', async () => {
      roleRepo.find.mockResolvedValue([
        {
          id: 2,
          role_name: 'PATIENT',
          description: null,
          role_code: '10003',
          permissions: undefined,
        },
      ]);
      permissionRepo.find.mockResolvedValue([]);

      const result = await service.getMatrix();

      expect(result.roles[0].permission_ids).toBeUndefined();
    });
  });
});
