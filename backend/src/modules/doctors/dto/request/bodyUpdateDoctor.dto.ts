import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DoctorLevel } from 'src/shared/enums/doctorLevel';

export class BodyUpdateDoctorDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  specialty_id?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  experience?: number;

  @IsString()
  @IsOptional()
  about_me?: string;

  @IsString()
  @IsOptional()
  workplace?: string;

  @IsEnum(DoctorLevel)
  @IsOptional()
  doctor_level?: DoctorLevel;
}
