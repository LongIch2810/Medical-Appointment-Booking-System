"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChatHistoryService", {
    enumerable: true,
    get: function() {
        return ChatHistoryService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _conversationentity = /*#__PURE__*/ _interop_require_default(require("../../entities/conversation.entity"));
const _typeorm1 = require("typeorm");
const _usersservice = require("../users/users.service");
const _config = require("@nestjs/config");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
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
let ChatHistoryService = class ChatHistoryService {
    async saveMessage(userId, role, content) {
        const user = await this.usersService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        await this.conversationRepo.save({
            user,
            role,
            content
        });
    }
    async getChatHistoryContext(userId) {
        const user = await this.usersService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        const history = await this.conversationRepo.find({
            where: {
                user: {
                    id: userId
                }
            },
            order: {
                created_at: 'DESC'
            },
            take: 10
        });
        return history;
    }
    async chatbotAnswer(userId, question, token) {
        const user = await this.usersService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        if (!token) {
            throw new _common.UnauthorizedException('Không có token xác thực.');
        }
        try {
            const response = await _axios.default.post(`${this.configService.get('CHATBOT_URL')}/chatbot/chat`, {
                question,
                userId,
                token
            });
            return response.data.answer;
        } catch (error) {
            console.log('>>> error:', error);
            console.error('Chatbot error:', error?.response?.data || error.message);
            if (_axios.default.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401) {
                    throw new _common.UnauthorizedException('Token chatbot không hợp lệ hoặc đã hết hạn.');
                }
            }
            throw new _common.HttpException('Không thể lấy phản hồi từ chatbot.', error?.response?.status || 500);
        }
    }
    async getChatHistory(userId, page = 1, limit = 50) {
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.conversationRepo.createQueryBuilder('conversation').innerJoin('conversation.user', 'user').select([
            'conversation.id AS id',
            'conversation.role AS role',
            'conversation.content AS content'
        ]).where('user.id = :userId', {
            userId
        }).orderBy('conversation.created_at', 'DESC').limit(limit).offset(skip);
        const [messages, total] = await Promise.all([
            query.getRawMany(),
            query.getCount()
        ]);
        const totalPages = Math.ceil(total / limit);
        const result = {
            total,
            messages: messages.reverse(),
            page,
            limit,
            totalPages
        };
        return result;
    }
    constructor(conversationRepo, usersService, configService){
        this.conversationRepo = conversationRepo;
        this.usersService = usersService;
        this.configService = configService;
    }
};
ChatHistoryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_conversationentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], ChatHistoryService);

//# sourceMappingURL=chat-history.service.js.map