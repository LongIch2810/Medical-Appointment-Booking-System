import {
  IsDateString,
  IsInt,
  IsMilitaryTime,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  Min,
} from 'class-validator';

export class BodyPreviewAppointmentDto {
  @IsDateString()
  appointment_date!: string;

  @IsInt()
  @Min(1)
  specialty_id!: number;

  @IsMilitaryTime()
  start_time!: string;

  @IsOptional()
  @IsMilitaryTime()
  end_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MinLength(2)
  @MaxLength(120)
  doctor_name?: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MinLength(2)
  @MaxLength(160)
  location?: string;
}
