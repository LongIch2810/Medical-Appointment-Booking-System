import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class BodyUpdateRelativeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  fullname?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  relationship_code?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\S+$/)
  @IsPhoneNumber('VN')
  @IsOptional()
  @IsNotEmpty()
  phone?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsBoolean()
  @IsOptional()
  gender?: boolean;
}
