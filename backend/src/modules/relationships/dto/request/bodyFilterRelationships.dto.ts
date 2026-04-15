import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterRelationshipsDto extends PaginationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['desc', 'asc'], { message: "'arrange pháº£i lÃ  asc hoáº·c desc'" })
  arrange: Arrange = 'desc';
}
