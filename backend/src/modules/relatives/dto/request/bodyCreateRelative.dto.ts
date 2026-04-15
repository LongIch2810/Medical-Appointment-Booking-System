import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsDateString,
  MinLength,
  Matches,
} from 'class-validator';

export class BodyCreateRelativeDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullname: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  relationship_code: string;

  @Transform(({ value }) => value.trim())
  @Matches(/^\S+$/)
  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsBoolean()
  @IsNotEmpty()
  gender: boolean;
}
