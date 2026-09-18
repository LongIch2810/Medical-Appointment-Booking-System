import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';
import { IsLessThanOrEqual } from 'src/common/decorators/isLessThanOrEqual.decorator';

export class BodyFilterHealthProfilesDto extends PaginationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  blood_type?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsLessThanOrEqual('maxHeartRate')
  minHeartRate?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxHeartRate?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsLessThanOrEqual('maxGlucoseLevel')
  minGlucoseLevel?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxGlucoseLevel?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsLessThanOrEqual('maxCholesterolLevel')
  minCholesterolLevel?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxCholesterolLevel?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsLessThanOrEqual('maxWeight')
  minWeight?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxWeight?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsLessThanOrEqual('maxHeight')
  minHeight?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxHeight?: number;

  @IsIn(['desc', 'asc'], { message: "'arrange pháº£i lÃ  asc hoáº·c desc'" })
  arrange: Arrange = 'desc';
}
