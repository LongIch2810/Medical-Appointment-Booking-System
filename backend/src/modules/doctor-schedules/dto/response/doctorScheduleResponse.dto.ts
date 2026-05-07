import { Exclude, Expose, Transform } from 'class-transformer';
import { formatHHMM } from 'src/utils/formatHHMM';
import { toHHMM } from 'src/utils/toMinutes';
import { Column } from 'typeorm';

@Exclude()
export class DoctorScheduleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  day_of_week!: string;

  @Expose()
  @Transform(({ value }) => toHHMM(value))
  start_time!: string;

  @Expose()
  @Transform(({ value }) => toHHMM(value))
  end_time!: string;

  @Expose()
  is_active!: boolean;
}
