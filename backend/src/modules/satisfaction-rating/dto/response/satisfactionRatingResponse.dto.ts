import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class SatisfactionRatingResponseDto {
  @Expose()
  id!: number;

  @Expose()
  rating_score!: number;

  @Expose()
  feedback!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: Date;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: Date;
}
