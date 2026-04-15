import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterUsersDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsNumber()
  @IsOptional()
  role_id?: number;

  @IsIn(['desc', 'asc'], { message: "'arrange phải là asc hoặc desc'" })
  arrange: Arrange = 'desc';
}
