import { Exclude, Expose, Type } from 'class-transformer';
import { AppointmentResponseDto } from 'src/modules/appointments/dto/response/appointmentResponse.dto';

@Exclude()
export class DoctorDashboardResponseDto {
  @Expose()
  totalAppointmentsToDayCount!: number;

  @Expose()
  upcomingAppointmentsCount!: number;

  @Expose()
  totalMessagesUnreadInAllChannelsCount!: number;

  @Expose()
  @Type(() => AppointmentResponseDto)
  appointmentToDayEarly!: AppointmentResponseDto | null;
}
