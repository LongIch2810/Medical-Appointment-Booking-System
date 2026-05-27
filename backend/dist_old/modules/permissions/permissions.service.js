"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermissionsService", {
    enumerable: true,
    get: function() {
        return PermissionsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _permissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/permission.entity"));
const _typeorm1 = require("typeorm");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _permissionsmapper = require("./permissions.mapper");
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
let PermissionsService = class PermissionsService {
    async filterAndPagination(objectFilters) {
        let { page, limit, search, arrange, role_id } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const keyword = search?.trim() ?? '';
        const roleIdCondition = role_id ? {
            roles: {
                role: {
                    id: role_id
                }
            }
        } : {};
        const where = keyword ? [
            {
                name: (0, _typeorm1.Like)(`%${keyword}%`)
            },
            {
                description: (0, _typeorm1.Like)(`%${keyword}%`)
            },
            roleIdCondition
        ] : [
            roleIdCondition
        ];
        const [permissions, total] = await this.permissionRepo.findAndCount({
            skip,
            take: limit,
            order: {
                name: arrange.toUpperCase()
            },
            where
        });
        const result = new _paginationResultdto.PaginationResultDto('permissions', _permissionsmapper.PermissionsMapper.toPermissionResponseDtoList(permissions), total, page, limit);
        return result;
    }
    async getPermissionDetail(id) {
        const permission = await this.findPermissionById(id);
        return _permissionsmapper.PermissionsMapper.toPermissionResponseDto(permission);
    }
    async checkPermissionExist(roleId, permissionName) {
        const permission = await this.permissionRepo.findOne({
            where: {
                roles: {
                    role: {
                        id: roleId
                    }
                },
                name: permissionName
            }
        });
        return !!permission;
    }
    async findPermissionById(id) {
        const permission = await this.permissionRepo.findOne({
            where: {
                id
            }
        });
        if (!permission) {
            throw new _common.NotFoundException(`Permission with id ${id} not found`);
        }
        return permission;
    }
    async isPermissionListExist(permissionIds) {
        const permissions = await this.permissionRepo.find({
            where: {
                id: (0, _typeorm1.In)(permissionIds)
            }
        });
        return permissions.length === permissionIds.length;
    }
    constructor(permissionRepo){
        this.permissionRepo = permissionRepo;
    }
};
PermissionsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_permissionentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], PermissionsService);

//# sourceMappingURL=permissions.service.js.map