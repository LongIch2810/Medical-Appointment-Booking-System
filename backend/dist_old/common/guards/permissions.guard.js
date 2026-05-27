"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermissionsGuard", {
    enumerable: true,
    get: function() {
        return PermissionsGuard;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _constants = require("../../utils/constants");
const _rolepermissionservice = require("../../modules/role-permission/role-permission.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PermissionsGuard = class PermissionsGuard {
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(_constants.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!requiredPermissions) return true;
        const req = context.switchToHttp().getRequest();
        if (!req.user) {
            throw new _common.UnauthorizedException('Không tìm thấy người dùng trong yêu cầu');
        }
        const { userId, roles } = req.user;
        console.log('req.user', req.user);
        const userPermissions = await this.rolePermissionService.getPermissionsByRoles(userId, roles);
        console.log('userPermissions', userPermissions);
        const hasPermission = requiredPermissions.every((permission)=>userPermissions.includes(permission));
        if (!hasPermission) {
            throw new _common.ForbiddenException('Bạn không có quyền truy cập!');
        }
        return true;
    }
    constructor(reflector, rolePermissionService){
        this.reflector = reflector;
        this.rolePermissionService = rolePermissionService;
    }
};
PermissionsGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector,
        typeof _rolepermissionservice.RolePermissionService === "undefined" ? Object : _rolepermissionservice.RolePermissionService
    ])
], PermissionsGuard);

//# sourceMappingURL=permissions.guard.js.map