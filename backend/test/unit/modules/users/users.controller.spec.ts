import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { UsersController } from 'src/modules/users/users.controller';

describe('UsersController authorization metadata', () => {
  it.each([
    'getUsers',
    'getUsersFilterAndPagination',
    'getAdminUserDetail',
    'updateAdminUser',
  ] as const)('requires user:manage for %s', (method) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype[method]),
    ).toEqual([PERMISSIONS.USER_MANAGE]);
  });
});
