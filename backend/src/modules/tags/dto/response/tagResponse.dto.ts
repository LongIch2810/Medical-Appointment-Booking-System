import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class TagResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
