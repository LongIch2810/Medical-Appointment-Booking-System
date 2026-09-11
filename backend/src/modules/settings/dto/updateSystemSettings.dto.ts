import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsBoolean()
  appointmentRemindersEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(10080)
  appointmentReminderBeforeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  appointmentEmailsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  defaultRealtimeToastsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  defaultEmailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  defaultAppointmentRemindersEnabled?: boolean;
}
