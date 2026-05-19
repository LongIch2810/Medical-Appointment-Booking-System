import { Exclude, Expose, Transform } from 'class-transformer';
import { formatDateTimeDDMMYYYYHHmm } from 'src/utils/formatDate';

@Exclude()
export class LastMessageDto {
  @Expose()
  content!: string;

  @Expose()
  @Transform(({ value }) => formatDateTimeDDMMYYYYHHmm(value))
  created_at!: string;

  @Expose()
  sender_id!: number;
}
