import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { MemberResponseDto } from 'src/modules/users/dto/response/memberResonse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import { LastMessageDto } from './lastMessage.dto';

@Exclude()
export class ChannelResponseDto {
  @Expose()
  id!: number;

  @Expose()
  @Transform(({ obj }) => obj.id)
  channel_id!: number;

  @Expose()
  @Type(() => LastMessageDto)
  last_message!: LastMessageDto | null;

  @Expose()
  @Transform(({ value }) => Number(value ?? 0))
  unread_count!: number;

  @Expose()
  @Type(() => MemberResponseDto)
  participants!: MemberResponseDto[];

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
