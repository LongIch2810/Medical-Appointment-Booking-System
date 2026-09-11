import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Like } from 'typeorm';
import Permission from 'src/entities/permission.entity';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { BodyFilterPermissionsDto } from 'src/modules/permissions/dto/request/bodyFilterPermissions.dto';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    permissionRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(Permission), useValue: permissionRepo },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe('filterAndPagination', () => {
    it('clamps page/limit to a minimum of 1 and returns a PaginationResultDto', async () => {
      const permissions = [
        { id: 1, name: 'user:manage', description: 'Manage users' },
      ];
      permissionRepo.findAndCount.mockResolvedValue([permissions, 1]);

      const result = await service.filterAndPagination({
        page: 0,
        limit: 0,
        arrange: 'asc',
      } as BodyFilterPermissionsDto);

      expect(result).toBeInstanceOf(PaginationResultDto);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.total).toBe(1);
      expect(result.permissions).toEqual([
        { id: 1, name: 'user:manage' },
      ]);
      expect(permissionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1,
          order: { name: 'ASC' },
        }),
      );
    });

    it('searches by name/description with a keyword when search is provided', async () => {
      await service.filterAndPagination({
        page: 1,
        limit: 10,
        search: '  manage  ',
        arrange: 'desc',
      } as BodyFilterPermissionsDto);

      expect(permissionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { name: Like('%manage%') },
            { description: Like('%manage%') },
            {},
          ],
        }),
      );
    });

    it('filters by role_id without a search keyword', async () => {
      await service.filterAndPagination({
        page: 1,
        limit: 10,
        role_id: 3,
        arrange: 'desc',
      } as BodyFilterPermissionsDto);

      expect(permissionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ roles: { role: { id: 3 } } }],
        }),
      );
    });

    it('combines search and role_id when both are provided', async () => {
      await service.filterAndPagination({
        page: 1,
        limit: 10,
        search: 'manage',
        role_id: 3,
        arrange: 'asc',
      } as BodyFilterPermissionsDto);

      expect(permissionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { name: Like('%manage%') },
            { description: Like('%manage%') },
            { roles: { role: { id: 3 } } },
          ],
        }),
      );
    });
  });

  describe('getPermissionDetail', () => {
    it('returns the mapped permission when found', async () => {
      permissionRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'user:manage',
      });

      const result = await service.getPermissionDetail(1);

      expect(result).toEqual({ id: 1, name: 'user:manage' });
    });

    it('throws NotFoundException when the permission does not exist', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.getPermissionDetail(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('checkPermissionExist', () => {
    it('returns true when a permission is linked to the given role', async () => {
      permissionRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.checkPermissionExist(2, 'user:manage'),
      ).resolves.toBe(true);
      expect(permissionRepo.findOne).toHaveBeenCalledWith({
        where: { roles: { role: { id: 2 } }, name: 'user:manage' },
      });
    });

    it('returns false when no permission is linked to the given role', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.checkPermissionExist(2, 'user:manage'),
      ).resolves.toBe(false);
    });
  });

  describe('findPermissionById', () => {
    it('returns the raw permission entity when found', async () => {
      const permission = { id: 1, name: 'user:manage' };
      permissionRepo.findOne.mockResolvedValue(permission);

      await expect(service.findPermissionById(1)).resolves.toBe(permission);
    });

    it('throws NotFoundException when the permission does not exist', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.findPermissionById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('isPermissionListExist', () => {
    it('returns true when every requested id exists', async () => {
      permissionRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await expect(
        service.isPermissionListExist([1, 2]),
      ).resolves.toBe(true);
    });

    it('returns false when some requested ids are missing', async () => {
      permissionRepo.find.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.isPermissionListExist([1, 2]),
      ).resolves.toBe(false);
    });
  });
});
