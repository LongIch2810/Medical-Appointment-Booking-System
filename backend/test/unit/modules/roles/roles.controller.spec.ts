import { RolesController } from 'src/modules/roles/roles.controller';

describe('RolesController', () => {
  const rolesService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateRolePermissions: jest.fn(),
    deleteRolePermissions: jest.fn(),
  };
  const controller = new RolesController(rolesService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('delegates to rolesService.filterAndPagination with the request body', async () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      rolesService.filterAndPagination.mockResolvedValue(expected);

      const result = await controller.getRoles(body);

      expect(rolesService.filterAndPagination).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('createRole', () => {
    it('delegates to rolesService.create with the request body', async () => {
      const body = { name: 'Admin' } as never;
      const expected = { roleId: 1, name: 'Admin' };
      rolesService.create.mockResolvedValue(expected);

      const result = await controller.createRole(body);

      expect(rolesService.create).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('getRoleDetail', () => {
    it('delegates to rolesService.findById with the roleId param', async () => {
      const expected = { roleId: 1, name: 'Admin' };
      rolesService.findById.mockResolvedValue(expected);

      const result = await controller.getRoleDetail(1);

      expect(rolesService.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('updateRole', () => {
    it('delegates to rolesService.update with roleId and body', async () => {
      const body = { name: 'Super Admin' } as never;
      const expected = { roleId: 1, name: 'Super Admin' };
      rolesService.update.mockResolvedValue(expected);

      const result = await controller.updateRole(1, body);

      expect(rolesService.update).toHaveBeenCalledWith(1, body);
      expect(result).toBe(expected);
    });
  });

  describe('updateRolePermissions', () => {
    it('delegates to rolesService.updateRolePermissions with roleId and permission_ids', async () => {
      const body = { permission_ids: [1, 2, 3] };
      const expected = { roleId: 1, permission_ids: [1, 2, 3] };
      rolesService.updateRolePermissions.mockResolvedValue(expected);

      const result = await controller.updateRolePermissions(1, body);

      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(1, [
        1, 2, 3,
      ]);
      expect(result).toBe(expected);
    });
  });

  describe('deleteRolePermissions', () => {
    it('delegates to rolesService.deleteRolePermissions with roleId and permission_ids', async () => {
      const body = { permission_ids: [1, 2] };
      const expected = { roleId: 1, permission_ids: [] };
      rolesService.deleteRolePermissions.mockResolvedValue(expected);

      const result = await controller.deleteRolePermissions(1, body);

      expect(rolesService.deleteRolePermissions).toHaveBeenCalledWith(1, [
        1, 2,
      ]);
      expect(result).toBe(expected);
    });
  });
});
