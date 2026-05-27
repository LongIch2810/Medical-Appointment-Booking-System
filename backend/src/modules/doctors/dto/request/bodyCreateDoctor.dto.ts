import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { DoctorLevel } from 'src/shared/enums/doctorLevel';

export class BodyCreateDoctorDto {
  @Type(() => Number)
  @IsNumber()
  user_id!: number;

  @Type(() => Number)
  @IsNumber()
  specialty_id!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience!: number;

  @IsString()
  about_me!: string;

  @IsString()
  workplace!: string;

  @IsEnum(DoctorLevel)
  doctor_level!: DoctorLevel;
}
