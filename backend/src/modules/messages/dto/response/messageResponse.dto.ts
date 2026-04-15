import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { MemberResponseDto } from 'src/modules/users/dto/response/memberResonse.dto';
import { MessageType } from 'src/shared/enums/messageType';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import { MessageAttachmentResponseDto } from './messageAttachmentResponse.dto';

@Exclude()
export class MessageResponseDto {
  @Expose()
  id!: number;

  @Expose()
  message_type!: MessageType;

  @Expose()
  content!: string;

  @Expose()
  is_read!: boolean;

  @Expose()
  @Type(() => MessageAttachmentResponseDto)
  message_attachments!: MessageAttachmentResponseDto[];

  @Expose()
  @Type(() => MemberResponseDto)
  sender!: MemberResponseDto;

  @Expose()
  channel!: number;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: Date;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: Date;
}
