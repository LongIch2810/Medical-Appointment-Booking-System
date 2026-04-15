import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from 'src/shared/enums/messageType';

export class BodyCreateMessageDto {
  @IsEnum(MessageType)
  message_type!: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  call_duration?: number;

  @IsNumber()
  sender_id!: number;

  @IsNumber()
  channel_id!: number;
}
