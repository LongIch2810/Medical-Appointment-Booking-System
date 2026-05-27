import { IsNumber, IsOptional } from 'class-validator';
import { BodyPersonalAppointmentsDto } from './bodyPersonalAppointments.dto';

export class BodyFilterImproveDto extends BodyPersonalAppointmentsDto {
  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsNumber()
  bookerId?: number;
}
