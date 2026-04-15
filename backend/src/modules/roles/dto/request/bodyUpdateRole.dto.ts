import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class BodyUpdateRoleDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\S+$/)
  @Matches(/^[a-zA-Z][a-zA-Z_]+$/)
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  role_name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : Number(value),
  )
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  role_code?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(20)
  description?: string;
}
