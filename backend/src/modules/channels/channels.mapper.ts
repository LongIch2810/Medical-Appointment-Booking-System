import { plainToInstance } from 'class-transformer';
import { ChannelResponseDto } from './dto/response/channelResponse.dto';
import Channel from 'src/entities/channel.entity';
import { decrypt } from '../../utils/encryption';

type EnrichedChannel = Channel & {
  last_message_content?: string | null;
  last_message_created_at?: Date | string | null;
  last_message_sender_id?: number | string | null;
  unread_count?: number | string | null;
};

const buildLastMessage = (channel: EnrichedChannel) => {
  const rawContent = channel.last_message_content;
  const createdAt = channel.last_message_created_at;
  const senderId = channel.last_message_sender_id;

  if (!rawContent || !createdAt) {
    return null;
  }

  return {
    content: decrypt(rawContent),
    created_at: createdAt,
    sender_id: Number(senderId ?? 0),
  };
};

const normalize = (channel: EnrichedChannel) => ({
  ...channel,
  participants: (channel.participants ?? []).map(
    (participant) => participant.user ?? participant,
  ),
  last_message: buildLastMessage(channel),
  unread_count: Number(channel.unread_count ?? 0),
});

export class ChannelsMapper {
  static toChannelResponseDto(channel: Channel): ChannelResponseDto {
    return plainToInstance(ChannelResponseDto, normalize(channel), {
      excludeExtraneousValues: true,
    });
  }

  static toChannelResponseDtoList(channels: Channel[]): ChannelResponseDto[] {
    return plainToInstance(
      ChannelResponseDto,
      channels.map((channel) => normalize(channel)),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
