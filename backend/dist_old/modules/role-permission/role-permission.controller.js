"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolePermissionController", {
    enumerable: true,
    get: function() {
        return RolePermissionController;
    }
});
const _common = require("@nestjs/common");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _jwtguard = require("../../common/guards/jwt.guard");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
const _rolepermissionservice = require("./role-permission.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RolePermissionController = class RolePermissionController {
    getMatrix() {
        return this.rolePermissionService.getMatrix();
    }
    constructor(rolePermissionService){
        this.rolePermissionService = rolePermissionService;
    }
};
_ts_decorate([
    (0, _common.Get)('matrix'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_PERMISSION_READ),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'READ',
        entityName: 'role-permission.matrix'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RolePermissionController.prototype, "getMatrix", null);
RolePermissionController = _ts_decorate([
    (0, _common.Controller)('role-permission'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rolepermissionservice.RolePermissionService === "undefined" ? Object : _rolepermissionservice.RolePermissionService
    ])
], RolePermissionController);

//# sourceMappingURL=role-permission.controller.js.map