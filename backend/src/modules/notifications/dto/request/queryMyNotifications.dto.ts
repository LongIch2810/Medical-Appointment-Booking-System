import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { NotificationType } from 'src/shared/enums/notificationType';

export class QueryMyNotificationsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit = 20;

  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}
