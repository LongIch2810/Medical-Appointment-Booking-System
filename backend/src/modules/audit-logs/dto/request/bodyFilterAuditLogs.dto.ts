import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterAuditLogsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  entityName?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsOptional()
  method?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isSuccess?: boolean;

  @IsString()
  @IsOptional()
  fromDate?: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
