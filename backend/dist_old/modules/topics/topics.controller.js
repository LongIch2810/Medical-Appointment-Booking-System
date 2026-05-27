"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TopicsController", {
    enumerable: true,
    get: function() {
        return TopicsController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _topicsservice = require("./topics.service");
const _bodyCreateTopicdto = require("./dto/request/bodyCreateTopic.dto");
const _bodyFilterTopicsdto = require("./dto/request/bodyFilterTopics.dto");
const _bodyUpdateTopicdto = require("./dto/request/bodyUpdateTopic.dto");
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
let TopicsController = class TopicsController {
    async getTopics(bodyFilterTopics) {
        return this.topicsService.filterAndPagination(bodyFilterTopics);
    }
    async createTopic(bodyCreateTopic) {
        return this.topicsService.create(bodyCreateTopic);
    }
    async getTopicDetail(topicId) {
        return this.topicsService.findById(topicId);
    }
    async updateTopic(topicId, bodyUpdateTopic) {
        return this.topicsService.update(topicId, bodyUpdateTopic);
    }
    async deleteTopic(topicId) {
        return this.topicsService.remove(topicId);
    }
    constructor(topicsService){
        this.topicsService = topicsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterTopicsdto.BodyFilterTopicsDto === "undefined" ? Object : _bodyFilterTopicsdto.BodyFilterTopicsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TopicsController.prototype, "getTopics", null);
_ts_decorate([
    (0, _common.Post)('create-topic'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TOPIC_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'topics'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateTopicdto.BodyCreateTopicDto === "undefined" ? Object : _bodyCreateTopicdto.BodyCreateTopicDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TopicsController.prototype, "createTopic", null);
_ts_decorate([
    (0, _common.Get)(':topicId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TOPIC_READ),
    _ts_param(0, (0, _common.Param)('topicId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], TopicsController.prototype, "getTopicDetail", null);
_ts_decorate([
    (0, _common.Patch)(':topicId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TOPIC_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'topics'
    }),
    _ts_param(0, (0, _common.Param)('topicId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateTopicdto.BodyUpdateTopicDto === "undefined" ? Object : _bodyUpdateTopicdto.BodyUpdateTopicDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TopicsController.prototype, "updateTopic", null);
_ts_decorate([
    (0, _common.Delete)(':topicId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TOPIC_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'topics'
    }),
    _ts_param(0, (0, _common.Param)('topicId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], TopicsController.prototype, "deleteTopic", null);
TopicsController = _ts_decorate([
    (0, _common.Controller)('topics'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _topicsservice.TopicsService === "undefined" ? Object : _topicsservice.TopicsService
    ])
], TopicsController);

//# sourceMappingURL=topics.controller.js.map