"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChatHistoryController", {
    enumerable: true,
    get: function() {
        return ChatHistoryController;
    }
});
const _common = require("@nestjs/common");
const _chathistoryservice = require("./chat-history.service");
const _bodyMessagedto = require("./dto/request/bodyMessage.dto");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyChatdto = require("./dto/request/bodyChat.dto");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
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
let ChatHistoryController = class ChatHistoryController {
    async getChatHistoryContext(userId) {
        const history = await this.chatHistoryService.getChatHistoryContext(userId);
        return history.reverse();
    }
    async saveMessage(body) {
        const { userId, role, content } = body;
        await this.chatHistoryService.saveMessage(userId, role, content);
        return {
            message: 'Message saved successfully'
        };
    }
    async chatWithChatbot(req, body) {
        const { userId } = req.user;
        const { accessToken: token } = req.cookies;
        const { question } = body;
        const answer = await this.chatHistoryService.chatbotAnswer(userId, question, token);
        return {
            answer
        };
    }
    getChatHistory(userId, page) {
        return this.chatHistoryService.getChatHistory(userId, page);
    }
    constructor(chatHistoryService){
        this.chatHistoryService = chatHistoryService;
    }
};
_ts_decorate([
    (0, _common.Get)('/context/:userId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHATBOT_CHAT),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "getChatHistoryContext", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHATBOT_CHAT),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyMessagedto.BodyMessageDto === "undefined" ? Object : _bodyMessagedto.BodyMessageDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "saveMessage", null);
_ts_decorate([
    (0, _common.Post)('chat'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHATBOT_CHAT),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyChatdto.BodyChatDto === "undefined" ? Object : _bodyChatdto.BodyChatDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "chatWithChatbot", null);
_ts_decorate([
    (0, _common.Get)(':userId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHATBOT_CHAT),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('page', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], ChatHistoryController.prototype, "getChatHistory", null);
ChatHistoryController = _ts_decorate([
    (0, _common.Controller)('chat-history'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _chathistoryservice.ChatHistoryService === "undefined" ? Object : _chathistoryservice.ChatHistoryService
    ])
], ChatHistoryController);

//# sourceMappingURL=chat-history.controller.js.map