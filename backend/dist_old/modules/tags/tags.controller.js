"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TagsController", {
    enumerable: true,
    get: function() {
        return TagsController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateTagdto = require("./dto/request/bodyCreateTag.dto");
const _bodyFilterTagsdto = require("./dto/request/bodyFilterTags.dto");
const _bodyUpdateTagdto = require("./dto/request/bodyUpdateTag.dto");
const _tagsservice = require("./tags.service");
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
let TagsController = class TagsController {
    async getTags(bodyFilterTags) {
        return this.tagsService.filterAndPagination(bodyFilterTags);
    }
    async createTag(bodyCreateTag) {
        return this.tagsService.create(bodyCreateTag);
    }
    async getTagDetail(tagId) {
        return this.tagsService.findById(tagId);
    }
    async updateTag(tagId, bodyUpdateTag) {
        return this.tagsService.update(tagId, bodyUpdateTag);
    }
    async deleteTag(tagId) {
        return this.tagsService.remove(tagId);
    }
    constructor(tagsService){
        this.tagsService = tagsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TAG_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterTagsdto.BodyFilterTagsDto === "undefined" ? Object : _bodyFilterTagsdto.BodyFilterTagsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "getTags", null);
_ts_decorate([
    (0, _common.Post)('create-tag'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TAG_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'tags'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateTagdto.BodyCreateTagDto === "undefined" ? Object : _bodyCreateTagdto.BodyCreateTagDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "createTag", null);
_ts_decorate([
    (0, _common.Get)(':tagId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TAG_READ),
    _ts_param(0, (0, _common.Param)('tagId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "getTagDetail", null);
_ts_decorate([
    (0, _common.Patch)(':tagId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TAG_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'tags'
    }),
    _ts_param(0, (0, _common.Param)('tagId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateTagdto.BodyUpdateTagDto === "undefined" ? Object : _bodyUpdateTagdto.BodyUpdateTagDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "updateTag", null);
_ts_decorate([
    (0, _common.Delete)(':tagId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.TAG_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'tags'
    }),
    _ts_param(0, (0, _common.Param)('tagId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "deleteTag", null);
TagsController = _ts_decorate([
    (0, _common.Controller)('tags'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tagsservice.TagsService === "undefined" ? Object : _tagsservice.TagsService
    ])
], TagsController);

//# sourceMappingURL=tags.controller.js.map