import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { CoachProfileController } from 'src/modules/coach-profile/coach-profile.controller';

describe('CoachProfileController', () => {
  const coachProfileService = {
    getByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const controller = new CoachProfileController(coachProfileService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets the authenticated user's coach profile", async () => {
    coachProfileService.getByUserId.mockResolvedValue({ id: 1 });

    const result = await controller.getMyCoachProfile({
      user: { userId: 7 },
    } as never);

    expect(coachProfileService.getByUserId).toHaveBeenCalledWith(7);
    expect(result).toEqual({ id: 1 });
  });

  it('creates a coach profile for the authenticated user', async () => {
    const body = { goal: 'lose weight' } as never;
    coachProfileService.create.mockResolvedValue({ id: 1 });

    const result = await controller.createCoachProfile(
      { user: { userId: 7 } } as never,
      body,
    );

    expect(coachProfileService.create).toHaveBeenCalledWith(7, body);
    expect(result).toEqual({ id: 1 });
  });

  it('updates the coach profile for the authenticated user', async () => {
    const body = { goal: 'gain muscle' } as never;
    coachProfileService.update.mockResolvedValue({ id: 1 });

    const result = await controller.updateCoachProfile(
      { user: { userId: 7 } } as never,
      body,
    );

    expect(coachProfileService.update).toHaveBeenCalledWith(7, body);
    expect(result).toEqual({ id: 1 });
  });
});

describe('CoachProfileController authorization metadata', () => {
  it.each([
    'getMyCoachProfile',
    'createCoachProfile',
    'updateCoachProfile',
  ] as const)('requires coach-profile:manage for %s', (method) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        CoachProfileController.prototype[method],
      ),
    ).toEqual([PERMISSIONS.COACH_PROFILE_MANAGE]);
  });
});
