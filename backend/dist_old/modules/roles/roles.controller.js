"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolesController", {
    enumerable: true,
    get: function() {
        return RolesController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateRoledto = require("./dto/request/bodyCreateRole.dto");
const _bodyFilterRolesdto = require("./dto/request/bodyFilterRoles.dto");
const _bodyUpdateRoledto = require("./dto/request/bodyUpdateRole.dto");
const _rolesservice = require("./roles.service");
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
let RolesController = class RolesController {
    async getRoles(bodyFilterRoles) {
        return this.rolesService.filterAndPagination(bodyFilterRoles);
    }
    async createRole(bodyCreateRole) {
        return this.rolesService.create(bodyCreateRole);
    }
    async getRoleDetail(roleId) {
        return this.rolesService.findById(roleId);
    }
    async updateRole(roleId, bodyUpdateRole) {
        return this.rolesService.update(roleId, bodyUpdateRole);
    }
    async updateRolePermissions(roleId, permission_ids) {
        return this.rolesService.updateRolePermissions(roleId, permission_ids);
    }
    constructor(rolesService){
        this.rolesService = rolesService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterRolesdto.BodyFilterRolesDto === "undefined" ? Object : _bodyFilterRolesdto.BodyFilterRolesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RolesController.prototype, "getRoles", null);
_ts_decorate([
    (0, _common.Post)('create-role'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'roles'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateRoledto.BodyCreateRoleDto === "undefined" ? Object : _bodyCreateRoledto.BodyCreateRoleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
_ts_decorate([
    (0, _common.Get)(':roleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_READ),
    _ts_param(0, (0, _common.Param)('roleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], RolesController.prototype, "getRoleDetail", null);
_ts_decorate([
    (0, _common.Patch)(':roleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'roles'
    }),
    _ts_param(0, (0, _common.Param)('roleId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateRoledto.BodyUpdateRoleDto === "undefined" ? Object : _bodyUpdateRoledto.BodyUpdateRoleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RolesController.prototype, "updateRole", null);
_ts_decorate([
    (0, _common.Put)(':roleId/permissions'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ROLE_PERMISSION_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'roles.permissions'
    }),
    _ts_param(0, (0, _common.Param)('roleId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Array
    ]),
    _ts_metadata("design:returntype", Promise)
], RolesController.prototype, "updateRolePermissions", null);
RolesController = _ts_decorate([
    (0, _common.Controller)('roles'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rolesservice.RolesService === "undefined" ? Object : _rolesservice.RolesService
    ])
], RolesController);

//# sourceMappingURL=roles.controller.js.map