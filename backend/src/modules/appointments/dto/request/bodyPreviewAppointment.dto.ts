import {
  IsDateString,
  IsInt,
  IsMilitaryTime,
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
}
