import {
  IsDateString,
  IsMilitaryTime,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BodyCancelAppointmentDto {
  @IsDateString()
  @IsOptional()
  appointment_date?: string;

  @IsMilitaryTime()
  @IsOptional()
  start_time?: string;

  @IsMilitaryTime()
  @IsOptional()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  appointment_id?: number;

  @IsOptional()
  @IsString()
  doctor_name?: string;

  @IsOptional()
  @IsString()
  specialty_name?: string;
}
