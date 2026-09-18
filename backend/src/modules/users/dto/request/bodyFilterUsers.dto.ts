import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export class BodyFilterUsersDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  role_id?: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsBoolean()
  @IsOptional()
  isLocking?: boolean;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsBoolean()
  @IsOptional()
  gender?: boolean;

  @IsDateString()
  @IsOptional()
  @IsBeforeOrEqual('createdTo')
  createdFrom?: string;

  @IsDateString()
  @IsOptional()
  createdTo?: string;

  @IsIn(['desc', 'asc'], { message: "'arrange phải là asc hoặc desc'" })
  arrange: Arrange = 'desc';
}
