"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolesService", {
    enumerable: true,
    get: function() {
        return RolesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _roleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/role.entity"));
const _typeorm1 = require("typeorm");
const _rolesmapper = require("./roles.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _permissionsservice = require("../permissions/permissions.service");
const _rolePermissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/rolePermission.entity"));
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
let RolesService = class RolesService {
    async create(body) {
        try {
            return await this.datasource.transaction(async (manager)=>{
                const { role_name, role_code, description, permission_ids } = body;
                const isExistsRoleByName = await this.isRoleNameExist(role_name);
                const isExistsRoleByCode = await this.isRoleCodeExist(role_code);
                if (isExistsRoleByName || isExistsRoleByCode) {
                    throw new _common.ConflictException('Vai trò đã tồn tại');
                }
                const uniquePermissionIds = [
                    ...new Set(permission_ids)
                ];
                const isPermissionListExist = await this.permissionsService.isPermissionListExist(uniquePermissionIds);
                if (!isPermissionListExist) {
                    throw new _common.NotFoundException('Danh sách quyền có quyền không tồn tại trong hệ thống');
                }
                const createdRole = manager.create(_roleentity.default, {
                    role_name,
                    role_code,
                    description
                });
                const newRole = await manager.save(_roleentity.default, createdRole);
                await manager.save(_rolePermissionentity.default, uniquePermissionIds.map((permission_id)=>({
                        role: {
                            id: newRole.id
                        },
                        permission: {
                            id: permission_id
                        }
                    })));
                const roleDetail = await this.getRoleDetail(newRole.id);
                return roleDetail;
            });
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Vai trò đã tồn tại');
            }
            throw error;
        }
    }
    async update(roleId, body) {
        return await this.datasource.transaction(async (manager)=>{
            const role = await manager.findOne(_roleentity.default, {
                where: {
                    id: roleId
                },
                relations: [
                    'permissions',
                    'permissions.permission'
                ]
            });
            if (!role) {
                throw new _common.NotFoundException('Vai trò không tồn tại');
            }
            const nextRoleName = body.role_name;
            const nextDescription = body.description;
            const nextRoleCode = body.role_code !== undefined ? Number(body.role_code) : undefined;
            if (nextRoleName && nextRoleName !== role.role_name) {
                const isExistsRoleByName = await manager.getRepository(_roleentity.default).createQueryBuilder('role').where('LOWER(role.role_name) = LOWER(:role_name)', {
                    role_name: nextRoleName
                }).andWhere('role.id != :roleId', {
                    roleId
                }).getOne();
                if (isExistsRoleByName) {
                    throw new _common.ConflictException('Vai trò đã tồn tại');
                }
                role.role_name = nextRoleName;
            }
            if (nextRoleCode !== undefined && nextRoleCode !== role.role_code) {
                const isExistsRoleByCode = await manager.getRepository(_roleentity.default).createQueryBuilder('role').where('role.role_code = :role_code', {
                    role_code: nextRoleCode
                }).andWhere('role.id != :roleId', {
                    roleId
                }).getOne();
                if (isExistsRoleByCode) {
                    throw new _common.ConflictException('Vai trò đã tồn tại');
                }
                role.role_code = nextRoleCode;
            }
            if (nextDescription) {
                role.description = nextDescription;
            }
            await manager.save(role);
            return _rolesmapper.RolesMapper.toRoleResponseDto(role);
        });
    }
    async updateRolePermissions(roleId, permissionIds) {
        return await this.datasource.transaction(async (manager)=>{
            const role = await manager.findOne(_roleentity.default, {
                where: {
                    id: roleId
                }
            });
            if (!role) {
                throw new _common.NotFoundException('Vai trò không tồn tại');
            }
            const uniquePermissionIds = [
                ...new Set(permissionIds)
            ];
            if (!uniquePermissionIds.length) {
                throw new _common.NotFoundException('Danh sách quyền không hợp lệ');
            }
            const isPermissionListExist = await this.permissionsService.isPermissionListExist(uniquePermissionIds);
            if (!isPermissionListExist) {
                throw new _common.NotFoundException('Danh sách quyền có quyền không tồn tại trong hệ thống');
            }
            const rolePermissionRepo = manager.getRepository(_rolePermissionentity.default);
            const existingRolePermissions = await rolePermissionRepo.find({
                where: {
                    role: {
                        id: roleId
                    },
                    permission: {
                        id: (0, _typeorm1.In)(uniquePermissionIds)
                    }
                },
                relations: [
                    'permission'
                ],
                withDeleted: true
            });
            const existingPermissionIds = new Set(existingRolePermissions.map((rolePermission)=>rolePermission.permission.id));
            const deletedRolePermissions = existingRolePermissions.filter((rolePermission)=>rolePermission.deleted_at);
            if (deletedRolePermissions.length) {
                await rolePermissionRepo.restore(deletedRolePermissions.map((rolePermission)=>rolePermission.id));
            }
            const newRolePermissions = uniquePermissionIds.filter((permissionId)=>!existingPermissionIds.has(permissionId)).map((permissionId)=>rolePermissionRepo.create({
                    role: {
                        id: roleId
                    },
                    permission: {
                        id: permissionId
                    }
                }));
            if (newRolePermissions.length) {
                await rolePermissionRepo.save(newRolePermissions);
            }
            return this.getRoleDetail(roleId);
        });
    }
    async deleteRolePermissions(roleId, permissionIds) {
        return await this.datasource.transaction(async (manager)=>{
            const role = await manager.findOne(_roleentity.default, {
                where: {
                    id: roleId
                }
            });
            if (!role) {
                throw new _common.NotFoundException('Vai trò không tồn tại');
            }
            const uniquePermissionIds = [
                ...new Set(permissionIds)
            ];
            if (!uniquePermissionIds.length) {
                throw new _common.NotFoundException('Danh sách quyền không hợp lệ');
            }
            const rolePermissionRepo = manager.getRepository(_rolePermissionentity.default);
            const rolePermissions = await rolePermissionRepo.find({
                where: {
                    role: {
                        id: roleId
                    },
                    permission: {
                        id: (0, _typeorm1.In)(uniquePermissionIds)
                    }
                },
                relations: [
                    'permission'
                ]
            });
            if (rolePermissions.length !== uniquePermissionIds.length) {
                throw new _common.NotFoundException('Một hoặc nhiều quyền không thuộc vai trò này');
            }
            await rolePermissionRepo.softDelete(rolePermissions.map((rolePermission)=>rolePermission.id));
            return this.getRoleDetail(roleId);
        });
    }
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { search, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const [roles, total] = await this.roleRepo.findAndCount({
            relations: [
                'permissions',
                'permissions.permission'
            ],
            skip,
            take: limit,
            order: {
                role_name: arrange.toUpperCase()
            },
            where: {
                role_name: (0, _typeorm1.Like)(`%${search}%`),
                description: (0, _typeorm1.Like)(`%${search}%`)
            }
        });
        const result = new _paginationResultdto.PaginationResultDto('roles', _rolesmapper.RolesMapper.toRoleResponseDtoList(roles), total, page, limit);
        return result;
    }
    async getRoleDetail(id) {
        const role = await this.findById(id);
        return _rolesmapper.RolesMapper.toRoleResponseDto(role);
    }
    async isRoleNameExist(role_name) {
        const role = await this.roleRepo.findOne({
            where: {
                role_name
            }
        });
        return !!role;
    }
    async isRoleCodeExist(role_code) {
        const role = await this.roleRepo.findOne({
            where: {
                role_code
            }
        });
        return !!role;
    }
    async findById(roleId) {
        const role = await this.roleRepo.findOne({
            where: {
                id: roleId
            },
            relations: [
                'permissions',
                'permissions.permission'
            ]
        });
        if (!role) {
            throw new _common.NotFoundException('Vai trò không tồn tại');
        }
        return role;
    }
    constructor(roleRepo, permissionsService, datasource){
        this.roleRepo = roleRepo;
        this.permissionsService = permissionsService;
        this.datasource = datasource;
    }
};
RolesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_roleentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _permissionsservice.PermissionsService === "undefined" ? Object : _permissionsservice.PermissionsService,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], RolesService);

//# sourceMappingURL=roles.service.js.map