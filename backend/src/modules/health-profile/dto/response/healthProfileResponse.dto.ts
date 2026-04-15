import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { RelativeResponseDto } from 'src/modules/relatives/dto/response/relativeResponse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class HealthProfileResponseDto {
  @Expose()
  id!: number;

  @Expose()
  weight!: number;

  @Expose()
  height!: number;

  // Nhóm máu
  @Expose()
  blood_type!: string;

  // Bệnh nền
  @Expose()
  medical_history!: string;

  // Dị ứng
  @Expose()
  allergies!: string;

  // Nhịp tim
  @Expose()
  heart_rate!: number;

  // Huyết áp
  @Expose()
  blood_pressure!: string;

  // Lượng đường huyết (mg/dL)
  @Expose()
  glucose_level!: number;

  // Mức cholesterol (mg/dL)
  @Expose()
  cholesterol_level!: number;

  // Thuốc đang sử dụng
  @Expose()
  medications!: string;

  // Các mũi vac xin đã tiêm
  @Expose()
  vaccinations!: string;

  // Có hút thuốc không ?
  @Expose()
  smoking!: boolean;

  // Có uống rượu hoặc bia không
  @Expose()
  alcohol_consumption!: boolean;

  // Tần suất vận động
  @Expose()
  exercise_frequency!: string;

  // Ngày khám gần nhất
  @Expose()
  last_checkup_date!: Date;

  @Expose()
  @Type(() => RelativeResponseDto)
  patient!: RelativeResponseDto;

  @Expose({ name: 'created_at' })
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: Date;

  @Expose({ name: 'updated_at' })
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: Date;
}
