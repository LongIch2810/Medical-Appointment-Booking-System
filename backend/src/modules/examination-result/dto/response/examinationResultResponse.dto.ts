import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { DoctorScheduleResponseDto } from 'src/modules/doctor-schedules/dto/response/doctorScheduleResponse.dto';
import { DoctorInformationResponseDto } from 'src/modules/doctors/dto/response/doctorInformationResponse.dto';
import { RelativeResponseDto } from 'src/modules/relatives/dto/response/relativeResponse.dto';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
class ExaminationResultAppointmentResponseDto {
  @Expose()
  id!: number;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  appointment_date!: string;

  @Expose()
  status!: AppointmentStatus;

  @Expose()
  booking_mode!: BookingMode;

  @Expose()
  @Type(() => DoctorScheduleResponseDto)
  doctor_schedule!: DoctorScheduleResponseDto;

  @Expose()
  @Type(() => RelativeResponseDto)
  patient!: RelativeResponseDto;

  @Expose()
  @Type(() => DoctorInformationResponseDto)
  doctor!: DoctorInformationResponseDto;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}

@Exclude()
export class ExaminationResultResponseDto {
  @Expose()
  id!: number;

  // các triệu chứng
  @Expose()
  symptoms!: string;

  // chuẩn đoán
  @Expose()
  diagnosis!: string;

  // Hướng dẫn điều trị
  @Expose()
  treatment!: string;

  // đơn thuốc
  @Expose()
  prescription!: string;

  @Expose()
  @Type(() => ExaminationResultAppointmentResponseDto)
  appointment!: ExaminationResultAppointmentResponseDto;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
