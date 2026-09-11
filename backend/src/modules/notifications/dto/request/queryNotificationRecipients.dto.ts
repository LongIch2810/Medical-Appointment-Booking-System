import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryNotificationRecipientsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit = 20;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  @IsOptional()
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @IsOptional()
  roleName?: string;
}
