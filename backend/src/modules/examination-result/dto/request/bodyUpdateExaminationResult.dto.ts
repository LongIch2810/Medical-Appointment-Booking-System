import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BodyUpdateExaminationResultDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  symptoms?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  diagnosis?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  treatment?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  prescription?: string;
}
