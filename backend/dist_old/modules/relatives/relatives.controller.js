"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelativesController", {
    enumerable: true,
    get: function() {
        return RelativesController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _relativesservice = require("./relatives.service");
const _bodyFilterRelativesdto = require("./dto/request/bodyFilterRelatives.dto");
const _bodyUpdateRelativedto = require("./dto/request/bodyUpdateRelative.dto");
const _bodyCreateRelativedto = require("./dto/request/bodyCreateRelative.dto");
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
let RelativesController = class RelativesController {
    createRelative(req, body) {
        const { userId } = req.user;
        return this.relativesService.create(userId, body);
    }
    findRelatives(req, query) {
        const { userId } = req.user;
        const bodyFilterRelatives = {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 10,
            search: query.search || query.name,
            relationshipCode: query.relationshipCode || query.relationship_code || undefined,
            arrange: query.arrange === 'asc' || query.arrange === 'desc' ? query.arrange : 'desc'
        };
        return this.relativesService.findRelativesByUserId(userId, bodyFilterRelatives);
    }
    async getRelativeDetail(req, relativeId) {
        const { userId } = req.user;
        return this.relativesService.getRelativeDetail(userId, relativeId);
    }
    async updateRelative(req, relativeId, bodyUpdateRelative) {
        const { userId } = req.user;
        return this.relativesService.update(userId, relativeId, bodyUpdateRelative);
    }
    async deleteRelative(req, relativeId) {
        const { userId } = req.user;
        return this.relativesService.remove(userId, relativeId);
    }
    findAdminRelatives(bodyFilterRelatives) {
        return this.relativesService.filterAndPagination(bodyFilterRelatives);
    }
    constructor(relativesService){
        this.relativesService = relativesService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'relatives'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyCreateRelativedto.BodyCreateRelativeDto === "undefined" ? Object : _bodyCreateRelativedto.BodyCreateRelativeDto
    ]),
    _ts_metadata("design:returntype", void 0)
], RelativesController.prototype, "createRelative", null);
_ts_decorate([
    (0, _common.Get)('patient/relatives'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof Record === "undefined" ? Object : Record
    ]),
    _ts_metadata("design:returntype", void 0)
], RelativesController.prototype, "findRelatives", null);
_ts_decorate([
    (0, _common.Get)(':relativeId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('relativeId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], RelativesController.prototype, "getRelativeDetail", null);
_ts_decorate([
    (0, _common.Patch)(':relativeId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'relatives'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('relativeId', _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number,
        typeof _bodyUpdateRelativedto.BodyUpdateRelativeDto === "undefined" ? Object : _bodyUpdateRelativedto.BodyUpdateRelativeDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RelativesController.prototype, "updateRelative", null);
_ts_decorate([
    (0, _common.Delete)(':relativeId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'relatives'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('relativeId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], RelativesController.prototype, "deleteRelative", null);
_ts_decorate([
    (0, _common.Post)('admin/relatives'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIVE_MANAGE),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterRelativesdto.BodyFilterRelativesDto === "undefined" ? Object : _bodyFilterRelativesdto.BodyFilterRelativesDto
    ]),
    _ts_metadata("design:returntype", void 0)
], RelativesController.prototype, "findAdminRelatives", null);
RelativesController = _ts_decorate([
    (0, _common.Controller)('relatives'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _relativesservice.RelativesService === "undefined" ? Object : _relativesservice.RelativesService
    ])
], RelativesController);

//# sourceMappingURL=relatives.controller.js.map