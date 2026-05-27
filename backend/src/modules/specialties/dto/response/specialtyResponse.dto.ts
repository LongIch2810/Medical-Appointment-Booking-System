import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class SpecialtyResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  description!: string;

  @Expose()
  img_url!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
