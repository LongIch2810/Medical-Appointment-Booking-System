import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional } from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterSatisfactionRatingsDto extends PaginationDto {
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

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
