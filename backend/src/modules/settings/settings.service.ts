import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemConfig } from 'src/entities/systemConfigs.entity';
import User from 'src/entities/user.entity';
import { UserSetting } from 'src/entities/userSetting.entity';
import { AuditContextService } from 'src/modules/audit-logs/audit-context.service';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UserTheme } from 'src/shared/enums/userTheme';
import { Repository } from 'typeorm';
import { UpdateSystemSettingsDto } from './dto/updateSystemSettings.dto';
import { UpdateUserSettingsDto } from './dto/updateUserSettings.dto';

const SYSTEM_SETTINGS_CACHE_KEY = 'settings:system';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly userSettingRepo: Repository<UserSetting>,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepo: Repository<SystemConfig>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisCacheService,
    private readonly auditContextService: AuditContextService,
  ) {}

  async getMySettings(userId: number) {
    const setting = await this.getOrCreateUserSetting(userId);
    const system = await this.getSystemEntity();
    return this.toUserResponse(setting, system);
  }

  async updateMySettings(userId: number, body: UpdateUserSettingsDto) {
    const setting = await this.getOrCreateUserSetting(userId);
    const system = await this.getSystemEntity();
    const oldData = this.toUserResponse(setting, system);

    if (body.realtimeToastsEnabled !== undefined) {
      setting.realtime_toasts_enabled = body.realtimeToastsEnabled;
    }
    if (body.emailNotificationsEnabled !== undefined) {
      setting.email_notifications_enabled = body.emailNotificationsEnabled;
    }
    if (body.appointmentRemindersEnabled !== undefined) {
      setting.appointment_reminders_enabled = body.appointmentRemindersEnabled;
    }
    if (body.theme !== undefined) setting.theme = body.theme;

    const saved = await this.userSettingRepo.save(setting);
    const response = this.toUserResponse(saved, system);
    this.auditContextService.setOldData(oldData);
    this.auditContextService.setNewData(response);
    return response;
  }

  async getSystemSettings() {
    return this.toSystemResponse(await this.getSystemEntity());
  }

  async updateSystemSettings(body: UpdateSystemSettingsDto) {
    // Always update the complete persisted entity. The cached representation is
    // intentionally smaller and must never be saved back to the database.
    const setting = await this.getSystemEntity(false);
    const oldData = this.toSystemResponse(setting);

    if (body.appointmentRemindersEnabled !== undefined) {
      setting.appointment_reminders_enabled = body.appointmentRemindersEnabled;
    }
    if (body.appointmentReminderBeforeMinutes !== undefined) {
      setting.reminder_appointment_before_minutes =
        body.appointmentReminderBeforeMinutes;
    }
    if (body.appointmentEmailsEnabled !== undefined) {
      setting.appointment_emails_enabled = body.appointmentEmailsEnabled;
    }
    if (body.defaultRealtimeToastsEnabled !== undefined) {
      setting.default_realtime_toasts_enabled =
        body.defaultRealtimeToastsEnabled;
    }
    if (body.defaultEmailNotificationsEnabled !== undefined) {
      setting.default_email_notifications_enabled =
        body.defaultEmailNotificationsEnabled;
    }
    if (body.defaultAppointmentRemindersEnabled !== undefined) {
      setting.default_appointment_reminders_enabled =
        body.defaultAppointmentRemindersEnabled;
    }

    const saved = await this.systemConfigRepo.save(setting);
    await this.redisService.delData(SYSTEM_SETTINGS_CACHE_KEY);
    const response = this.toSystemResponse(saved);
    this.auditContextService.setOldData(oldData);
    this.auditContextService.setNewData(response);
    return response;
  }

  async isRealtimeToastEnabled(userId: number): Promise<boolean> {
    return (await this.getOrCreateUserSetting(userId)).realtime_toasts_enabled;
  }

  async shouldSendAppointmentEmail(userId: number): Promise<boolean> {
    const { userSetting, systemSetting } =
      await this.getUserAndSystemSettings(userId);
    return (
      systemSetting.appointment_emails_enabled &&
      userSetting.email_notifications_enabled
    );
  }

  async shouldSendAppointmentReminder(userId: number): Promise<boolean> {
    const { userSetting, systemSetting } =
      await this.getUserAndSystemSettings(userId);
    return (
      systemSetting.appointment_reminders_enabled &&
      userSetting.appointment_reminders_enabled
    );
  }

  private async getUserAndSystemSettings(userId: number) {
    const [userSetting, systemSetting] = await Promise.all([
      this.getOrCreateUserSetting(userId),
      this.getSystemEntity(),
    ]);
    return { userSetting, systemSetting };
  }

  async getAppointmentReminderBeforeMinutes(): Promise<number> {
    return (await this.getSystemEntity()).reminder_appointment_before_minutes;
  }

  private async getOrCreateUserSetting(userId: number) {
    const existing = await this.userSettingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (existing) return existing;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');
    const system = await this.getSystemEntity();
    return this.userSettingRepo.save(
      this.userSettingRepo.create({
        user,
        realtime_toasts_enabled: system.default_realtime_toasts_enabled,
        email_notifications_enabled: system.default_email_notifications_enabled,
        appointment_reminders_enabled:
          system.default_appointment_reminders_enabled,
        theme: UserTheme.SYSTEM,
      }),
    );
  }

  private async getSystemEntity(useCache = true): Promise<SystemConfig> {
    if (useCache) {
      const cached = await this.redisService.getData<SystemConfig>(
        SYSTEM_SETTINGS_CACHE_KEY,
      );
      // JSON round-trip qua Redis biến created_at/updated_at thành string;
      // rehydrate lại 2 field này thành Date cho khớp shape thật của entity.
      if (cached) {
        return {
          ...cached,
          created_at: new Date(cached.created_at),
          updated_at: new Date(cached.updated_at),
        };
      }
    }

    let setting = await this.systemConfigRepo.findOne({
      where: {},
      order: { id: 'ASC' },
    });
    if (!setting) setting = await this.systemConfigRepo.save({});
    await this.redisService.setData(SYSTEM_SETTINGS_CACHE_KEY, setting, 60);
    return setting;
  }

  private toUserResponse(setting: UserSetting, system: SystemConfig) {
    return {
      realtimeToastsEnabled: setting.realtime_toasts_enabled,
      emailNotificationsEnabled: setting.email_notifications_enabled,
      appointmentRemindersEnabled: setting.appointment_reminders_enabled,
      theme: setting.theme,
      effectiveAppointmentReminderBeforeMinutes:
        system.reminder_appointment_before_minutes,
      updatedAt: setting.updated_at,
    };
  }

  private toSystemResponse(setting: SystemConfig) {
    return {
      id: setting.id,
      appointmentRemindersEnabled: setting.appointment_reminders_enabled,
      appointmentReminderBeforeMinutes:
        setting.reminder_appointment_before_minutes,
      appointmentEmailsEnabled: setting.appointment_emails_enabled,
      defaultRealtimeToastsEnabled: setting.default_realtime_toasts_enabled,
      defaultEmailNotificationsEnabled:
        setting.default_email_notifications_enabled,
      defaultAppointmentRemindersEnabled:
        setting.default_appointment_reminders_enabled,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at,
    };
  }
}
