import { Exclude, Expose, Transform } from 'class-transformer';
import { toHHMM } from 'src/utils/toMinutes';

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
