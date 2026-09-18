import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';
import { IsLessThanOrEqual } from 'src/common/decorators/isLessThanOrEqual.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterSatisfactionRatingsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsDateString()
  @IsOptional()
  @IsBeforeOrEqual('toDate', { message: 'fromDate must be before toDate' })
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  doctorId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  @IsLessThanOrEqual('maxRating')
  minRating?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
