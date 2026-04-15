import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class BodyUpdateSatisfactionRatingDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating_score?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  @IsString()
  feedback?: string;
}
