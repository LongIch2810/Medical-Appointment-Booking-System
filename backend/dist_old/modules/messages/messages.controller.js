"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessagesController", {
    enumerable: true,
    get: function() {
        return MessagesController;
    }
});
const _common = require("@nestjs/common");
const _messagesservice = require("./messages.service");
const _bodyCreateMessagedto = require("./dto/request/bodyCreateMessage.dto");
const _jwtguard = require("../../common/guards/jwt.guard");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
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
let MessagesController = class MessagesController {
    handleSaveMessage(bodyCreateMessage) {
        return this.messagesService.saveMessage(bodyCreateMessage);
    }
    getMessagesByChannelId(channelId, page) {
        return this.messagesService.getMessageByChannelId(channelId, page);
    }
    constructor(messagesService){
        this.messagesService = messagesService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.MESSAGE_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'messages'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateMessagedto.BodyCreateMessageDto === "undefined" ? Object : _bodyCreateMessagedto.BodyCreateMessageDto
    ]),
    _ts_metadata("design:returntype", void 0)
], MessagesController.prototype, "handleSaveMessage", null);
_ts_decorate([
    (0, _common.Get)(':channelId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.MESSAGE_READ),
    _ts_param(0, (0, _common.Param)('channelId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Query)('page', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], MessagesController.prototype, "getMessagesByChannelId", null);
MessagesController = _ts_decorate([
    (0, _common.Controller)('messages'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _messagesservice.MessagesService === "undefined" ? Object : _messagesservice.MessagesService
    ])
], MessagesController);

//# sourceMappingURL=messages.controller.js.map