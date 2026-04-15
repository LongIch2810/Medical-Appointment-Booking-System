import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterExaminationResultsDto extends PaginationDto {
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  date?: string;

  @IsIn(['desc', 'asc'], { message: "'arrange pháº£i lÃ  asc hoáº·c desc'" })
  arrange: Arrange = 'desc';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  relativeId?: number;
}
