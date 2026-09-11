import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserTheme } from 'src/shared/enums/userTheme';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsBoolean()
  realtimeToastsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  appointmentRemindersEnabled?: boolean;

  @IsOptional()
  @IsEnum(UserTheme)
  theme?: UserTheme;
}
