"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessagesMapper", {
    enumerable: true,
    get: function() {
        return MessagesMapper;
    }
});
const _messageResponsedto = require("./dto/response/messageResponse.dto");
const _classtransformer = require("class-transformer");
let MessagesMapper = class MessagesMapper {
    static toMessageResponseDto(message) {
        return (0, _classtransformer.plainToInstance)(_messageResponsedto.MessageResponseDto, message, {
            excludeExtraneousValues: true
        });
    }
    static toMessageResponseDtoList(messages) {
        return (0, _classtransformer.plainToInstance)(_messageResponsedto.MessageResponseDto, messages, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=messages.mapper.js.map