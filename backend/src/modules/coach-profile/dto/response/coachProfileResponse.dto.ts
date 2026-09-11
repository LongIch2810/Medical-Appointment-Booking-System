import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class CoachProfileResponseDto {
  @Expose()
  id!: number;

  @Expose()
  display_name!: string;

  @Expose()
  health_goal!: string;

  @Expose()
  preferences!: string[] | null;

  @Expose()
  age!: number | null;

  @Expose()
  height!: number | null;

  @Expose()
  weight!: number | null;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
