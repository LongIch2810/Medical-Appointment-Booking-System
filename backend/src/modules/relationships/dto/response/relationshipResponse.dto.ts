import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class RelationshipResponseDto {
  @Expose()
  id!: number;

  @Expose()
  relationship_code!: string;

  @Expose()
  relationship_name!: string;

  @Expose()
  description!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
