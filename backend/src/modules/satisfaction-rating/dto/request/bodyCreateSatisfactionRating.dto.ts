import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class BodyCreateSatisfactionRating {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating_score!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @IsString()
  feedback!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  appointment_id!: number;
}
