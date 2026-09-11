/* eslint-disable @typescript-eslint/unbound-method */
import { SystemConfig } from 'src/entities/systemConfigs.entity';
import User from 'src/entities/user.entity';
import { UserSetting } from 'src/entities/userSetting.entity';
import { UserTheme } from 'src/shared/enums/userTheme';
import { Repository } from 'typeorm';
import { SettingsService } from 'src/modules/settings/settings.service';

describe('SettingsService', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');
  let userSettingRepo: jest.Mocked<Repository<UserSetting>>;
  let systemConfigRepo: jest.Mocked<Repository<SystemConfig>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let redisService: {
    getData: jest.Mock;
    setData: jest.Mock;
    delData: jest.Mock;
  };
  let auditContext: { setOldData: jest.Mock; setNewData: jest.Mock };
  let service: SettingsService;

  const systemSetting = (): SystemConfig =>
    ({
      id: 1,
      reminder_appointment_before_minutes: 1440,
      reminder_update_health_profile_after_minutes: 60,
      appointment_reminders_enabled: true,
      appointment_emails_enabled: true,
      default_realtime_toasts_enabled: true,
      default_email_notifications_enabled: true,
      default_appointment_reminders_enabled: true,
      created_at: now,
      updated_at: now,
    }) as SystemConfig;

  beforeEach(() => {
    userSettingRepo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value as UserSetting),
      save: jest.fn((value) => Promise.resolve(value as UserSetting)),
    } as unknown as jest.Mocked<Repository<UserSetting>>;
    systemConfigRepo = {
      findOne: jest.fn().mockResolvedValue(systemSetting()),
      create: jest.fn((value) => value as SystemConfig),
      save: jest.fn((value) => Promise.resolve(value as SystemConfig)),
    } as unknown as jest.Mocked<Repository<SystemConfig>>;
    userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 7 }),
    } as unknown as jest.Mocked<Repository<User>>;
    redisService = {
      getData: jest.fn().mockResolvedValue(null),
      setData: jest.fn(),
      delData: jest.fn(),
    };
    auditContext = {
      setOldData: jest.fn(),
      setNewData: jest.fn(),
    };
    service = new SettingsService(
      userSettingRepo,
      systemConfigRepo,
      userRepo,
      redisService as never,
      auditContext as never,
    );
  });

  it('creates missing personal settings from the system defaults', async () => {
    userSettingRepo.findOne.mockResolvedValue(null);

    const result = await service.getMySettings(7);

    expect(userSettingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        realtime_toasts_enabled: true,
        email_notifications_enabled: true,
        appointment_reminders_enabled: true,
        theme: UserTheme.SYSTEM,
      }),
    );
    expect(result.effectiveAppointmentReminderBeforeMinutes).toBe(1440);
  });

  it('combines the global and personal switches for appointment email', async () => {
    userSettingRepo.findOne.mockResolvedValue({
      email_notifications_enabled: false,
    } as UserSetting);

    await expect(service.shouldSendAppointmentEmail(7)).resolves.toBe(false);
  });

  it('updates the complete database entity instead of saving a cached projection', async () => {
    redisService.getData.mockResolvedValue({
      id: 1,
      appointmentReminderBeforeMinutes: 15,
      appointmentRemindersEnabled: true,
      appointmentEmailsEnabled: true,
      defaultRealtimeToastsEnabled: true,
      defaultEmailNotificationsEnabled: true,
      defaultAppointmentRemindersEnabled: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    const persisted = systemSetting();
    systemConfigRepo.findOne.mockResolvedValue(persisted);

    await service.updateSystemSettings({
      appointmentReminderBeforeMinutes: 30,
    });

    expect(systemConfigRepo.findOne).toHaveBeenCalled();
    expect(systemConfigRepo.save).toHaveBeenCalledWith(persisted);
    expect(persisted.reminder_update_health_profile_after_minutes).toBe(60);
    expect(redisService.delData).toHaveBeenCalledWith('settings:system');
  });
});
