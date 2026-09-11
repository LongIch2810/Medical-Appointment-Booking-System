import { IsOptional, IsString, Matches } from 'class-validator';

export class BodyUpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\/(?!\/)/, {
    message: 'actionUrl phải là đường dẫn nội bộ bắt đầu bằng /.',
  })
  actionUrl?: string;
}
