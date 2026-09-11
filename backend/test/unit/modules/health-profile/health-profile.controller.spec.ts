import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { HealthProfileController } from 'src/modules/health-profile/health-profile.controller';

describe('HealthProfileController', () => {
  const healthProfileService = {
    listHealthProfilesByUserId: jest.fn(),
    update: jest.fn(),
    getHealthProfile: jest.fn(),
    filterAndPagination: jest.fn(),
  };
  const controller = new HealthProfileController(
    healthProfileService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the authenticated user's health profiles", async () => {
    const filters = { page: 1 } as never;
    healthProfileService.listHealthProfilesByUserId.mockResolvedValue({
      items: [],
    });

    const result = await controller.getListHealthProfilesByPersonal(
      { user: { userId: 7 } } as never,
      filters,
    );

    expect(
      healthProfileService.listHealthProfilesByUserId,
    ).toHaveBeenCalledWith(7, filters);
    expect(result).toEqual({ items: [] });
  });

  it('updates a health profile owned by the authenticated user', async () => {
    const body = { weight: 70 } as never;
    healthProfileService.update.mockResolvedValue({ id: 3 });

    const result = await controller.updateHealthProfile(
      { user: { userId: 7 } } as never,
      3,
      body,
    );

    expect(healthProfileService.update).toHaveBeenCalledWith(7, 3, body);
    expect(result).toEqual({ id: 3 });
  });

  it('gets a health profile by relative id, scoped to the authenticated user', async () => {
    healthProfileService.getHealthProfile.mockResolvedValue({ id: 3 });

    const result = await controller.getHealthProfileByRelativeId(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(healthProfileService.getHealthProfile).toHaveBeenCalledWith(7, 3);
    expect(result).toEqual({ id: 3 });
  });

  it('lists health profiles for admins with filters and pagination', async () => {
    const filters = { page: 1 } as never;
    healthProfileService.filterAndPagination.mockResolvedValue({ items: [] });

    const result = await controller.filterAndPagination(filters);

    expect(healthProfileService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toEqual({ items: [] });
  });
});

describe('HealthProfileController authorization metadata', () => {
  it.each([
    ['getListHealthProfilesByPersonal', PERMISSIONS.HEALTH_PROFILE_READ],
    ['updateHealthProfile', PERMISSIONS.HEALTH_PROFILE_UPDATE],
    ['getHealthProfileByRelativeId', PERMISSIONS.HEALTH_PROFILE_READ],
    ['filterAndPagination', PERMISSIONS.HEALTH_PROFILE_MANAGE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        HealthProfileController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
