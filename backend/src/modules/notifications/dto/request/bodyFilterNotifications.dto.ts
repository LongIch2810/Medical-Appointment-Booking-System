import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';
import { NotificationType } from 'src/shared/enums/notificationType';

export class BodyFilterNotificationsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  userId?: number;

  @Transform(({ value }) => {
    if (value === true || value === false) return value;
    if (typeof value !== 'string') return value;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsBeforeOrEqual('toDate', { message: 'fromDate must be before toDate' })
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  toDate?: string;

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
