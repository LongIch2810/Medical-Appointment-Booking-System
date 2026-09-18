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
import { ComplaintStatus } from 'src/entities/complaint.entity';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterComplaintsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(Object.values(ComplaintStatus))
  @IsOptional()
  status?: ComplaintStatus;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  userId?: number;

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
