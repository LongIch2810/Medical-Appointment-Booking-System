import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class BodyCreateSpecialtyDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  description!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^\S+$/)
  @IsString()
  @IsOptional()
  img_url?: string;
}
