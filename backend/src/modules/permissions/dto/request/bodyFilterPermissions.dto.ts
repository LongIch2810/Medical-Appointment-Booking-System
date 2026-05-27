import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';

export class BodyFilterPermissionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsIn(['desc', 'asc'], { message: "'arrange' must be 'asc' or 'desc'" })
  arrange: Arrange = 'desc';
}
