import { Exclude, Expose, Transform } from 'class-transformer';
import { formatHHMM } from 'src/utils/formatHHMM';
import { Column } from 'typeorm';

@Exclude()
export class DoctorScheduleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  day_of_week!: string;

  @Expose()
  @Transform(({ value }) => formatHHMM(value))
  start_time!: string;

  @Expose()
  @Transform(({ value }) => formatHHMM(value))
  end_time!: string;

  @Column({ default: true })
  is_active!: boolean;
}
