"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChannelsMapper", {
    enumerable: true,
    get: function() {
        return ChannelsMapper;
    }
});
const _classtransformer = require("class-transformer");
const _channelResponsedto = require("./dto/response/channelResponse.dto");
const _encryption = require("../../utils/encryption");
const buildLastMessage = (channel)=>{
    const rawContent = channel.last_message_content;
    const createdAt = channel.last_message_created_at;
    const senderId = channel.last_message_sender_id;
    if (!rawContent || !createdAt) {
        return null;
    }
    return {
        content: (0, _encryption.decrypt)(rawContent),
        created_at: createdAt,
        sender_id: Number(senderId ?? 0)
    };
};
const normalize = (channel)=>({
        ...channel,
        participants: (channel.participants ?? []).map((participant)=>participant.user ?? participant),
        last_message: buildLastMessage(channel),
        unread_count: Number(channel.unread_count ?? 0)
    });
let ChannelsMapper = class ChannelsMapper {
    static toChannelResponseDto(channel) {
        return (0, _classtransformer.plainToInstance)(_channelResponsedto.ChannelResponseDto, normalize(channel), {
            excludeExtraneousValues: true
        });
    }
    static toChannelResponseDtoList(channels) {
        return (0, _classtransformer.plainToInstance)(_channelResponsedto.ChannelResponseDto, channels.map((channel)=>normalize(channel)), {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=channels.mapper.js.map