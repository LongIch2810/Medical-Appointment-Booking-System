import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterExaminationResultsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  date?: string;

  /** Preferred name for a range start; `date` remains for compatibility. */
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsBeforeOrEqual('toDate', { message: 'date must be before toDate' })
  toDate?: string;

  @IsIn(['desc', 'asc'], { message: "'arrange pháº£i lÃ  asc hoáº·c desc'" })
  arrange: Arrange = 'desc';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  relativeId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  doctorId?: number;
}
