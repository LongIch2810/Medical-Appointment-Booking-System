import Appointment from 'src/entities/appointment.entity';
import { AppointmentResponseDto } from './dto/response/appointmentResponse.dto';
import { plainToInstance } from 'class-transformer';

export class AppointmentsMapper {
  static toAppointmentResponseDto(
    appointment: Appointment,
  ): AppointmentResponseDto {
    return plainToInstance(
      AppointmentResponseDto,
      { ...appointment, doctor: appointment.doctor_schedule.doctor },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  static toAppointmentResponseDtoList(
    appointments: Appointment[],
  ): AppointmentResponseDto[] {
    return plainToInstance(
      AppointmentResponseDto,
      appointments.map((appointment) => ({
        ...appointment,
        doctor: appointment.doctor_schedule.doctor,
      })),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
