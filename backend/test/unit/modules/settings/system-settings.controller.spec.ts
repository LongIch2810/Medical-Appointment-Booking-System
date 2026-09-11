import { SystemSettingsController } from 'src/modules/settings/system-settings.controller';

describe('SystemSettingsController', () => {
  const settingsService = {
    getSystemSettings: jest.fn(),
    updateSystemSettings: jest.fn(),
  };
  const controller = new SystemSettingsController(settingsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('delegates to settingsService.getSystemSettings and returns its result', () => {
      const expected = { appointmentWindowDays: 30 };
      settingsService.getSystemSettings.mockReturnValue(expected);

      const result = controller.getSettings();

      expect(settingsService.getSystemSettings).toHaveBeenCalledWith();
      expect(result).toBe(expected);
    });
  });

  describe('updateSettings', () => {
    it('delegates to settingsService.updateSystemSettings with the request body', () => {
      const body = { appointmentWindowDays: 45 } as never;
      const expected = { appointmentWindowDays: 45 };
      settingsService.updateSystemSettings.mockReturnValue(expected);

      const result = controller.updateSettings(body);

      expect(settingsService.updateSystemSettings).toHaveBeenCalledWith(
        body,
      );
      expect(result).toBe(expected);
    });
  });
});
