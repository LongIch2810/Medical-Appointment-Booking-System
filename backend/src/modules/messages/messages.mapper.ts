import Message from 'src/entities/message.entity';
import { MessageResponseDto } from './dto/response/messageResponse.dto';
import { plainToInstance } from 'class-transformer';

export class MessagesMapper {
  static toMessageResponseDto(message: Message): MessageResponseDto {
    return plainToInstance(MessageResponseDto, message, {
      excludeExtraneousValues: true,
    });
  }

  static toMessageResponseDtoList(messages: Message[]): MessageResponseDto[] {
    return plainToInstance(MessageResponseDto, messages, {
      excludeExtraneousValues: true,
    });
  }
}
