"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermissionsController", {
    enumerable: true,
    get: function() {
        return PermissionsController;
    }
});
const _common = require("@nestjs/common");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _jwtguard = require("../../common/guards/jwt.guard");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
const _permissionsservice = require("./permissions.service");
const _bodyFilterPermissionsdto = require("./dto/request/bodyFilterPermissions.dto");
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
let PermissionsController = class PermissionsController {
    async getFilterPermissions(objectFilters) {
        const result = await this.permissionsService.filterAndPagination(objectFilters);
        return result;
    }
    async getPermissionDetail(permissionId) {
        const permission = await this.permissionsService.getPermissionDetail(permissionId);
        return permission;
    }
    constructor(permissionsService){
        this.permissionsService = permissionsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.PERMISSION_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterPermissionsdto.BodyFilterPermissionsDto === "undefined" ? Object : _bodyFilterPermissionsdto.BodyFilterPermissionsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], PermissionsController.prototype, "getFilterPermissions", null);
_ts_decorate([
    (0, _common.Get)(':permissionId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.PERMISSION_READ),
    _ts_param(0, (0, _common.Param)('permissionId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], PermissionsController.prototype, "getPermissionDetail", null);
PermissionsController = _ts_decorate([
    (0, _common.Controller)('permissions'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _permissionsservice.PermissionsService === "undefined" ? Object : _permissionsservice.PermissionsService
    ])
], PermissionsController);

//# sourceMappingURL=permissions.controller.js.map