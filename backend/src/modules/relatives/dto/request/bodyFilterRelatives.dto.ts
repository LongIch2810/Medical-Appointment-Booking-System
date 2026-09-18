import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export class BodyFilterRelativesDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  relationshipCode?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return value === true || value === 'true';
  })
  @IsBoolean()
  @IsOptional()
  gender?: boolean;

  @IsDateString()
  @IsOptional()
  @IsBeforeOrEqual('dobTo')
  dobFrom?: string;

  @IsDateString()
  @IsOptional()
  dobTo?: string;

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
