import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export enum NotificationAudience {
  ALL = 'ALL',
  ROLE = 'ROLE',
  USERS = 'USERS',
}

export class BodySendNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsIn(Object.values(NotificationAudience), {
    message: 'audience không hợp lệ',
  })
  audience!: NotificationAudience;

  @ValidateIf(
    (o: BodySendNotificationDto) => o.audience === NotificationAudience.ROLE,
  )
  @IsString()
  roleName?: string;

  @ValidateIf(
    (o: BodySendNotificationDto) => o.audience === NotificationAudience.USERS,
  )
  @IsArray()
  @ArrayNotEmpty({ message: 'Phải chọn ít nhất một người nhận.' })
  @IsInt({ each: true })
  @Type(() => Number)
  userIds?: number[];

  @IsString()
  @IsOptional()
  @Matches(/^\/(?!\/)/, {
    message: 'actionUrl phải là đường dẫn nội bộ bắt đầu bằng /.',
  })
  actionUrl?: string;
}
