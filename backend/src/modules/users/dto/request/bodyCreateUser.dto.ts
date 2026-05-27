import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DoctorLevel } from 'src/shared/enums/doctorLevel';

export class BodyCreateUserDoctorDto {
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  specialty_id!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience!: number;

  @IsString()
  @IsNotEmpty()
  about_me!: string;

  @IsString()
  @IsNotEmpty()
  workplace!: string;

  @IsEnum(DoctorLevel)
  doctor_level!: DoctorLevel;
}

export class BodyCreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S+$/)
  username!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @Matches(/^\S+$/)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S+$/)
  password!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullname!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  gender?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_locking?: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  role_ids!: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BodyCreateUserDoctorDto)
  doctor?: BodyCreateUserDoctorDto;
}
