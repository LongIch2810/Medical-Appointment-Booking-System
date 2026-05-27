"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthProfileController", {
    enumerable: true,
    get: function() {
        return HealthProfileController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _healthprofileservice = require("./health-profile.service");
const _bodyFilterHealthProfilesdto = require("./dto/request/bodyFilterHealthProfiles.dto");
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
let HealthProfileController = class HealthProfileController {
    async getListHealthProfilesByPersonal(req, objectFilters) {
        const { userId } = req.user;
        return this.healthProfileService.listHealthProfilesByUserId(userId, objectFilters);
    }
    async updateHealthProfile(req, relativeId, bodyUpdateHealProfile) {
        const { userId } = req.user;
        const updatedHealProfile = await this.healthProfileService.update(userId, relativeId, bodyUpdateHealProfile);
        return updatedHealProfile;
    }
    async getHealthProfileByRelativeId(req, relativeId) {
        const { userId } = req.user;
        return this.healthProfileService.getHealthProfile(userId, relativeId);
    }
    async filterAndPagination(objectFilters) {
        return this.healthProfileService.filterAndPagination(objectFilters);
    }
    constructor(healthProfileService){
        this.healthProfileService = healthProfileService;
    }
};
_ts_decorate([
    (0, _common.Post)('patient/list'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.HEALTH_PROFILE_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyFilterHealthProfilesdto.BodyFilterHealthProfilesDto === "undefined" ? Object : _bodyFilterHealthProfilesdto.BodyFilterHealthProfilesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthProfileController.prototype, "getListHealthProfilesByPersonal", null);
_ts_decorate([
    (0, _common.Patch)('update/:id'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.HEALTH_PROFILE_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'health-profiles'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('id', _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number,
        typeof Partial === "undefined" ? Object : Partial
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthProfileController.prototype, "updateHealthProfile", null);
_ts_decorate([
    (0, _common.Get)(':relativeId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.HEALTH_PROFILE_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('relativeId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthProfileController.prototype, "getHealthProfileByRelativeId", null);
_ts_decorate([
    (0, _common.Post)('admin/list'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.HEALTH_PROFILE_MANAGE),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterHealthProfilesdto.BodyFilterHealthProfilesDto === "undefined" ? Object : _bodyFilterHealthProfilesdto.BodyFilterHealthProfilesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthProfileController.prototype, "filterAndPagination", null);
HealthProfileController = _ts_decorate([
    (0, _common.Controller)('health-profiles'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthprofileservice.HealthProfileService === "undefined" ? Object : _healthprofileservice.HealthProfileService
    ])
], HealthProfileController);

//# sourceMappingURL=health-profile.controller.js.map