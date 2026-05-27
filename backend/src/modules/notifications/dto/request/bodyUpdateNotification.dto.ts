import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BodyUpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isNotified?: boolean;
}
