import { IsDateString, IsEnum, IsNumber, Validate } from 'class-validator';
import { BookingMode } from 'src/shared/enums/bookingMode';

export class BodyCreateAppointmentDto {
  @IsDateString()
  appointment_date!: string;

  @IsNumber()
  doctor_schedule_id!: number;

  @IsNumber()
  relative_id!: number;

  @IsEnum(BookingMode)
  booking_mode!: BookingMode;
}
