import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Arrange } from 'src/shared/types/global.type';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export class BodyFilterTagsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

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
