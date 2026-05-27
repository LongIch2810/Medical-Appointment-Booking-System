import { IsEnum } from 'class-validator';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';

export class BodyUpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
