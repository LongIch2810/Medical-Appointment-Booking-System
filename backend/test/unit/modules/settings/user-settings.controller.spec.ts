import { UserSettingsController } from 'src/modules/settings/user-settings.controller';

describe('UserSettingsController', () => {
  const settingsService = {
    getMySettings: jest.fn(),
    updateMySettings: jest.fn(),
  };
  const controller = new UserSettingsController(settingsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMine', () => {
    it('delegates to settingsService.getMySettings with the authenticated userId', () => {
      const expected = { theme: 'dark' };
      settingsService.getMySettings.mockReturnValue(expected);

      const result = controller.getMine({ user: { userId: 7 } } as never);

      expect(settingsService.getMySettings).toHaveBeenCalledWith(7);
      expect(result).toBe(expected);
    });
  });

  describe('updateMine', () => {
    it('delegates to settingsService.updateMySettings with the authenticated userId and body', () => {
      const body = { theme: 'light' } as never;
      const expected = { theme: 'light' };
      settingsService.updateMySettings.mockReturnValue(expected);

      const result = controller.updateMine(
        { user: { userId: 7 } } as never,
        body,
      );

      expect(settingsService.updateMySettings).toHaveBeenCalledWith(7, body);
      expect(result).toBe(expected);
    });
  });
});
