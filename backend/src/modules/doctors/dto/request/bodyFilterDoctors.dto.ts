import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class BodyFilterDoctorsDto extends PaginationDto {
  @IsNumber()
  @IsOptional()
  specialty_id?: number;

  @IsNumber()
  @IsOptional()
  @Min(3)
  min_experience?: number;

  @IsNumber()
  @IsOptional()
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
