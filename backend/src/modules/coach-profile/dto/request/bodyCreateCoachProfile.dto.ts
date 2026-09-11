import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BodyCreateCoachProfileDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  display_name!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  health_goal!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[];

  @IsInt()
  @Min(1)
  @Max(120)
  @IsOptional()
  age?: number;

  @IsInt()
  @Min(30)
  @Max(300)
  @IsOptional()
  height?: number;

  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  weight?: number;
}
