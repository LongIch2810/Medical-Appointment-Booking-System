import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { MessageResponseDto } from 'src/modules/messages/dto/response/messageResponse.dto';
import { MemberResponseDto } from 'src/modules/users/dto/response/memberResonse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class ChannelResponseDto {
  @Expose()
  id!: number;

  @Expose()
  @Type(() => MessageResponseDto)
  chat_messages!: MessageResponseDto[];

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
