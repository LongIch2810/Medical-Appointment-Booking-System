"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessagesService", {
    enumerable: true,
    get: function() {
        return MessagesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _messageentity = /*#__PURE__*/ _interop_require_default(require("../../entities/message.entity"));
const _messageAttachmentsentity = /*#__PURE__*/ _interop_require_default(require("../../entities/messageAttachments.entity"));
const _typeorm1 = require("typeorm");
const _encryption = require("../../utils/encryption");
const _messagesmapper = require("./messages.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _channelsservice = require("../channels/channels.service");
const _usersservice = require("../users/users.service");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let MessagesService = class MessagesService {
    async saveMessage(bodyCreateMessage) {
        if (bodyCreateMessage?.content) {
            bodyCreateMessage.content = (0, _encryption.encrypt)(bodyCreateMessage.content);
        }
        const createdMessage = this.messageRepo.create({
            ...bodyCreateMessage,
            sender: {
                id: bodyCreateMessage.sender_id
            },
            channel: {
                id: bodyCreateMessage.channel_id
            }
        });
        const newMessage = await this.messageRepo.save(createdMessage);
        return this.getMessageByMessageId(newMessage.id);
    }
    async updateFilesMessage(messageId, files) {
        const exists = await this.messageRepo.findOne({
            where: {
                id: messageId
            }
        });
        if (!exists) {
            throw new _common.NotFoundException('Tin nhắn không tồn tại !');
        }
        const attachments = files.map((file)=>this.messageAttachmentRepo.create({
                message: {
                    id: messageId
                },
                ...file
            }));
        await this.messageAttachmentRepo.save(attachments);
        return await this.getMessageByMessageId(messageId);
    }
    async getMessageByMessageId(messageId) {
        const message = await this.messageRepo.findOne({
            where: {
                id: messageId
            },
            relations: [
                'message_attachments',
                'sender',
                'channel'
            ]
        });
        if (!message) {
            throw new _common.NotFoundException('Tin nhắn không tồn tại !');
        }
        if (message?.content) {
            message.content = (0, _encryption.decrypt)(message.content);
        }
        return _messagesmapper.MessagesMapper.toMessageResponseDto(message);
    }
    async getMessageByChannelId(channelId, page = 1, limit = 7) {
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const [messages, total] = await this.messageRepo.createQueryBuilder('message').leftJoinAndSelect('message.sender', 'sender').leftJoinAndSelect('message.message_attachments', 'attachments').where('message.channel_id = :channelId', {
            channelId
        }).orderBy('message.created_at', 'DESC').skip(skip).take(limit).getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('messages', _messagesmapper.MessagesMapper.toMessageResponseDtoList(messages.map((m)=>({
                ...m,
                content: m.content ? (0, _encryption.decrypt)(m.content) : null
            }))), total, page, limit);
        return result;
    }
    async numberOfMessagesUnreadInChannel(userId, channelId) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại !');
        }
        const isChannelExists = await this.channelsService.isChannelExists(userId, channelId);
        if (!isChannelExists) {
            throw new _common.NotFoundException('Kênh trò chuyện không tồn tại hoặc bạn không thuộc về kênh này !');
        }
        const count = await this.messageRepo.count({
            where: {
                channel: {
                    id: channelId,
                    participants: {
                        user: {
                            id: userId
                        }
                    }
                },
                is_read: false,
                sender: {
                    id: (0, _typeorm1.Not)(userId)
                }
            }
        });
        return count;
    }
    async numberOfMessagesUnreadInAllChannel(userId) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại !');
        }
        const count = await this.messageRepo.count({
            where: {
                is_read: false,
                sender: {
                    id: (0, _typeorm1.Not)(userId)
                },
                channel: {
                    participants: {
                        user: {
                            id: userId
                        }
                    }
                }
            }
        });
        return count;
    }
    constructor(messageRepo, messageAttachmentRepo, channelsService, usersService){
        this.messageRepo = messageRepo;
        this.messageAttachmentRepo = messageAttachmentRepo;
        this.channelsService = channelsService;
        this.usersService = usersService;
    }
};
MessagesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_messageentity.default)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_messageAttachmentsentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _channelsservice.ChannelsService === "undefined" ? Object : _channelsservice.ChannelsService,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], MessagesService);

//# sourceMappingURL=messages.service.js.map