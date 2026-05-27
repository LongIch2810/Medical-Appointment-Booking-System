"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolePermissionService", {
    enumerable: true,
    get: function() {
        return RolePermissionService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _permissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/permission.entity"));
const _roleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/role.entity"));
const _rolePermissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/rolePermission.entity"));
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _typeorm1 = require("typeorm");
const _rolepermissionmapper = require("./role-permission.mapper");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let RolePermissionService = class RolePermissionService {
    async getPermissionsByRoles(userId, roles) {
        // const cacheKey = `permissions:${userId}`;
        // const cachedData = (await this.redisCacheService.getData(
        //   cacheKey,
        // )) as string[];
        // if (cachedData) return cachedData;
        const rawPermissions = await this.rolePermissionRepository.createQueryBuilder('rp').innerJoin('rp.permission', 'permission').innerJoin('rp.role', 'role').where('role.role_name IN (:...roles)', {
            roles
        }).select('DISTINCT permission.name', 'name').getRawMany();
        const permissions = rawPermissions.map((item)=>item.name);
        // await this.redisCacheService.setData(cacheKey, permissions, 3600);
        return permissions;
    }
    async getMatrix() {
        const [roles, permissions] = await Promise.all([
            this.roleRepo.find({
                relations: [
                    'permissions',
                    'permissions.permission'
                ],
                order: {
                    role_name: 'ASC'
                }
            }),
            this.permissionRepo.find({
                order: {
                    name: 'ASC'
                }
            })
        ]);
        return _rolepermissionmapper.RolePermissionMapper.toMatrixResponseDto({
            roles: roles.map((role)=>({
                    id: role.id,
                    role_name: role.role_name,
                    description: role.description,
                    role_code: role.role_code,
                    permission_ids: role.permissions?.filter((rolePermission)=>!rolePermission.deleted_at).map((rolePermission)=>rolePermission.permission.id)
                })),
            permissions: permissions.map((permission)=>({
                    id: permission.id,
                    name: permission.name
                }))
        });
    }
    constructor(rolePermissionRepository, roleRepo, permissionRepo, redisCacheService){
        this.rolePermissionRepository = rolePermissionRepository;
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
        this.redisCacheService = redisCacheService;
    }
};
RolePermissionService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_rolePermissionentity.default)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_roleentity.default)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_permissionentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], RolePermissionService);

//# sourceMappingURL=role-permission.service.js.map