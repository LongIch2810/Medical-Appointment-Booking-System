import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { PermissionsController } from 'src/modules/permissions/permissions.controller';
import { BodyFilterPermissionsDto } from 'src/modules/permissions/dto/request/bodyFilterPermissions.dto';

describe('PermissionsController', () => {
  const permissionsService = {
    filterAndPagination: jest.fn(),
    getPermissionDetail: jest.fn(),
  };
  const controller = new PermissionsController(permissionsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates filtered/paginated listing to the service', async () => {
    const filters: BodyFilterPermissionsDto = {
      page: 1,
      limit: 10,
      arrange: 'desc',
    } as BodyFilterPermissionsDto;
    const expected = { permissions: [], total: 0 };
    permissionsService.filterAndPagination.mockResolvedValue(expected);

    const result = await controller.getFilterPermissions(filters);

    expect(permissionsService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toBe(expected);
  });

  it('delegates permission detail lookup to the service', async () => {
    const expected = { id: 5, name: 'user:manage' };
    permissionsService.getPermissionDetail.mockResolvedValue(expected);

    const result = await controller.getPermissionDetail(5);

    expect(permissionsService.getPermissionDetail).toHaveBeenCalledWith(5);
    expect(result).toBe(expected);
  });

  it.each(['getFilterPermissions', 'getPermissionDetail'] as const)(
    'requires permission:read for %s',
    (method) => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_KEY,
          PermissionsController.prototype[method],
        ),
      ).toEqual([PERMISSIONS.PERMISSION_READ]);
    },
  );
});
