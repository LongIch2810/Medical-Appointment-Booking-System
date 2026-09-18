import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class BodyFilterDoctorsDto extends PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  specialty_id?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_experience?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  max_experience?: number;

  @IsString()
  @IsOptional()
  workplace?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
