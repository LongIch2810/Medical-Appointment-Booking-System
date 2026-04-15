import { plainToInstance } from 'class-transformer';
import { ChannelResponseDto } from './dto/response/channelResponse.dto';
import Channel from 'src/entities/channel.entity';

export class ChannelsMapper {
  static toChannelResponseDto(channel: Channel): ChannelResponseDto {
    return plainToInstance(ChannelResponseDto, channel, {
      excludeExtraneousValues: true,
    });
  }

  static toChannelResponseDtoList(channels: Channel[]): ChannelResponseDto[] {
    return plainToInstance(ChannelResponseDto, channels, {
      excludeExtraneousValues: true,
    });
  }
}
