import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AuthorResponseDto } from 'src/modules/users/dto/response/authorResponse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class AuditLogResponseDto {
  @Expose()
  id!: number;

  @Expose()
  action!: string;

  @Expose()
  entity_name!: string;

  @Expose()
  old_data!: Record<string, unknown> | null;

  @Expose()
  new_data!: Record<string, unknown> | null;

  @Expose()
  endpoint!: string;

  @Expose()
  method!: string;

  @Expose()
  status_code!: number;

  @Expose()
  is_success!: boolean;

  @Expose()
  error_message!: string | null;

  @Expose()
  ip_address!: string | null;

  @Expose()
  user_agent!: string | null;

  @Expose()
  duration_ms!: number;

  @Expose()
  @Type(() => AuthorResponseDto)
  user!: AuthorResponseDto | null;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}

@Exclude()
export class AuditLogListResponseDto {
  @Expose()
  @Type(() => AuditLogResponseDto)
  auditLogs!: AuditLogResponseDto[];

  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalPages!: number;
}
