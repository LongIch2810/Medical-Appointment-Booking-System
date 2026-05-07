import { Exclude, Expose, Transform } from 'class-transformer';
import type { AppointmentResponseDto } from 'src/modules/appointments/dto/response/appointmentResponse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

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
  appointment!: AppointmentResponseDto;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
