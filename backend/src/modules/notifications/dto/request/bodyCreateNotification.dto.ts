import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class BodyCreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsNumber()
  userId!: number;

  @IsString()
  @IsOptional()
  @Matches(/^\/(?!\/)/, {
    message: 'actionUrl phải là đường dẫn nội bộ bắt đầu bằng /.',
  })
  actionUrl?: string;
}
