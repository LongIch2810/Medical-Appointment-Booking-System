import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class TopicResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: Date;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: Date;
}
