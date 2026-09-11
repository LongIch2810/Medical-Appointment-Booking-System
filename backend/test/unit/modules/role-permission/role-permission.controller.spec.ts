import { RolePermissionController } from 'src/modules/role-permission/role-permission.controller';

describe('RolePermissionController', () => {
  const rolePermissionService = {
    getMatrix: jest.fn(),
  };
  const controller = new RolePermissionController(
    rolePermissionService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMatrix', () => {
    it('delegates to rolePermissionService.getMatrix and returns its result', () => {
      const expected = { roles: [], permissions: [] };
      rolePermissionService.getMatrix.mockReturnValue(expected);

      const result = controller.getMatrix();

      expect(rolePermissionService.getMatrix).toHaveBeenCalledWith();
      expect(result).toBe(expected);
    });
  });
});
