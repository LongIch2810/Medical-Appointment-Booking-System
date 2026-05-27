import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { DoctorScheduleResponseDto } from 'src/modules/doctor-schedules/dto/response/doctorScheduleResponse.dto';
import { DoctorInformationResponseDto } from 'src/modules/doctors/dto/response/doctorInformationResponse.dto';
import { ExaminationResultResponseDto } from 'src/modules/examination-result/dto/response/examinationResultResponse.dto';
import { RelativeResponseDto } from 'src/modules/relatives/dto/response/relativeResponse.dto';
import { SatisfactionRatingResponseDto } from 'src/modules/satisfaction-rating/dto/response/satisfactionRatingResponse.dto';
import { UserResponseDto } from 'src/modules/users/dto/response/userResponse.dto';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class AppointmentResponseDto {
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
  @Type(() => ExaminationResultResponseDto)
  examination_result!: ExaminationResultResponseDto;

  @Expose()
  @Type(() => SatisfactionRatingResponseDto)
  satisfaction_rating!: SatisfactionRatingResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  booked_by_user!: UserResponseDto;

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
