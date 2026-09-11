import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { NotificationType } from 'src/shared/enums/notificationType';

@Exclude()
class NotificationRecipientDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  email!: string;
}

@Exclude()
export class NotificationResponseDto {
  @Expose()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  content!: string;

  @Expose()
  type!: NotificationType;

  @Expose({ name: 'is_read' })
  isRead!: boolean;

  @Expose({ name: 'action_url' })
  actionUrl!: string | null;

  @Expose()
  @Transform(({ value }) => (value ?? {}) as Record<string, unknown>)
  metadata!: Record<string, unknown>;

  @Expose({ name: 'created_at' })
  createdAt!: Date;

  @Expose({ name: 'updated_at' })
  updatedAt!: Date;

  @Expose()
  @Type(() => NotificationRecipientDto)
  user?: NotificationRecipientDto;
}
