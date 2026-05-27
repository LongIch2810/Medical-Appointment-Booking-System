/* eslint-disable */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChannelsController", {
    enumerable: true,
    get: function() {
        return ChannelsController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _channelsservice = require("./channels.service");
const _bodyFilterChannelsdto = require("./dto/request/bodyFilterChannels.dto");
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
let ChannelsController = class ChannelsController {
    createChannel(member_ids) {
        return this.channelsService.createChannel(member_ids);
    }
    getPersonalChannels(req, objectFilters) {
        const { userId } = req.user;
        return this.channelsService.findChannelsByUserId(userId, objectFilters);
    }
    getChannelDetail(req, channelId) {
        const { userId } = req.user;
        return this.channelsService.getChannel(channelId, userId);
    }
    constructor(channelsService){
        this.channelsService = channelsService;
    }
};
_ts_decorate([
    (0, _common.Post)('create'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHANNEL_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'channels'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array
    ]),
    _ts_metadata("design:returntype", void 0)
], ChannelsController.prototype, "createChannel", null);
_ts_decorate([
    (0, _common.Post)('/personal-channels'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHANNEL_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyFilterChannelsdto.BodyFilterChannelsDto === "undefined" ? Object : _bodyFilterChannelsdto.BodyFilterChannelsDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ChannelsController.prototype, "getPersonalChannels", null);
_ts_decorate([
    (0, _common.Get)(':channelId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.CHANNEL_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('channelId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], ChannelsController.prototype, "getChannelDetail", null);
ChannelsController = _ts_decorate([
    (0, _common.Controller)('channels'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _channelsservice.ChannelsService === "undefined" ? Object : _channelsservice.ChannelsService
    ])
], ChannelsController);

//# sourceMappingURL=channels.controller.js.map