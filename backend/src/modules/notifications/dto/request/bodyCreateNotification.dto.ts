import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class BodyCreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsNumber()
  userId!: number;

  @IsBoolean()
  @IsOptional()
  isNotified?: boolean;
}
