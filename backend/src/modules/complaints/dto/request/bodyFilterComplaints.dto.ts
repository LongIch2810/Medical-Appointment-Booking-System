import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
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

  @IsString()
  @IsOptional()
  fromDate?: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  @IsIn(['desc', 'asc'], { message: 'arrange phải là asc hoặc desc' })
  arrange: Arrange = 'desc';
}
