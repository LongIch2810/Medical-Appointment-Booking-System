import { plainToInstance } from 'class-transformer';
import { ChannelResponseDto } from './dto/response/channelResponse.dto';
import Channel from 'src/entities/channel.entity';

export class ChannelsMapper {
  static toChannelResponseDto(channel: Channel): ChannelResponseDto {
    const normalizedChannel = {
      ...channel,
      participants: (channel.participants ?? []).map(
        (participant) => participant.user ?? participant,
      ),
      chat_messages: channel.chat_messages ?? [],
    };

    return plainToInstance(ChannelResponseDto, normalizedChannel, {
      excludeExtraneousValues: true,
    });
  }

  static toChannelResponseDtoList(channels: Channel[]): ChannelResponseDto[] {
    return plainToInstance(
      ChannelResponseDto,
      channels.map((channel) => ({
        ...channel,
        participants: (channel.participants ?? []).map(
          (participant) => participant.user ?? participant,
        ),
        chat_messages: channel.chat_messages ?? [],
      })),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
