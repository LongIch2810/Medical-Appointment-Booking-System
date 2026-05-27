"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelativesService", {
    enumerable: true,
    get: function() {
        return RelativesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
const _usersservice = require("../users/users.service");
const _relativesmapper = require("./relatives.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _relationshipsservice = require("../relationships/relationships.service");
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
let RelativesService = class RelativesService {
    async create(userId, createRelativeDto) {
        try {
            return await this.dataSource.transaction(async (manager)=>{
                const { relationship_code, phone, fullname, ...rest } = createRelativeDto;
                const relationship = await manager.findOne(_relationshipentity.default, {
                    where: {
                        relationship_code: relationship_code
                    }
                });
                if (!relationship) {
                    throw new _common.NotFoundException('Mã mối quan hệ không tồn tại');
                }
                if (phone) {
                    const isExists = await this.isRelativeExists(userId, fullname, relationship_code, phone);
                    if (isExists) {
                        throw new _common.ConflictException('Người thân đã tồn tại trong hệ thống!');
                    }
                }
                const createdRelative = manager.create(_relativeentity.default, {
                    ...rest,
                    fullname,
                    phone: phone ?? null,
                    user: {
                        id: userId
                    },
                    relationship: {
                        relationship_code: relationship_code
                    }
                });
                const saved = await manager.save(_relativeentity.default, createdRelative);
                const newHealthProfile = manager.create(_healthProfileentity.default, {
                    patient: {
                        id: createdRelative.id
                    }
                });
                await manager.save(_healthProfileentity.default, newHealthProfile);
                const relative = await this.findOwnedByUserIdTransaction(manager, userId, saved.id);
                return _relativesmapper.RelativesMapper.toRelativeResponseDto(relative);
            });
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Người thân đã tồn tại trong hệ thống!');
            }
            throw error;
        }
    }
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { search, relationshipCode, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseRelativesQuery().orderBy('relative.created_at', arrange.toUpperCase());
        if (search) {
            query.andWhere('lower(relative.fullname) LIKE lower(:search)', {
                search: `%${search}%`
            });
            query.orWhere('relative.phone LIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('lower(relationship.relationship_name) LIKE lower(:search)', {
                search: `%${search}%`
            });
        }
        if (relationshipCode) {
            query.andWhere('lower(relative.relationship_code) = lower(:relationshipCode)', {
                relationshipCode
            });
        }
        const [relatives, total] = await query.skip(skip).take(limit).getManyAndCount();
        return new _paginationResultdto.PaginationResultDto('relatives', _relativesmapper.RelativesMapper.toRelativeResponseDtoList(relatives), total, page, limit);
    }
    async findRelativesByUserId(userId, objectFilters) {
        let { page, limit } = objectFilters;
        const { search, relationshipCode, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Không tìm thấy người dùng');
        }
        const query = this.baseRelativesQuery().orderBy('relative.created_at', arrange.toUpperCase()).where('user.id = :userId', {
            userId
        });
        if (search) {
            query.andWhere('lower(relative.fullname) LIKE lower(:search)', {
                search: `%${search}%`
            });
            query.orWhere('relative.phone LIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('lower(relationship.relationship_name) LIKE lower(:search)', {
                search: `%${search}%`
            });
        }
        if (relationshipCode) {
            query.andWhere('lower(relative.relationship_code) = lower(:relationshipCode)', {
                relationshipCode
            });
        }
        const [relatives, total] = await query.skip(skip).take(limit).getManyAndCount();
        return new _paginationResultdto.PaginationResultDto('relatives', _relativesmapper.RelativesMapper.toRelativeResponseDtoList(relatives), total, page, limit);
    }
    async findOwnedByUserId(userId, relativeId) {
        const relative = await this.relativeRepo.findOne({
            where: {
                id: relativeId,
                user: {
                    id: userId
                }
            },
            relations: [
                'relationship',
                'health_profile',
                'user'
            ]
        });
        if (!relative) {
            throw new _common.NotFoundException('Người thân không tồn tại hoặc không thuộc quyền quản lý của bạn.');
        }
        return relative;
    }
    async update(userId, relativeId, bodyUpdateRelative) {
        try {
            const relative = await this.findOwnedByUserId(userId, relativeId);
            if (bodyUpdateRelative.relationship_code) {
                const relationship = await this.relationshipsService.findByRelationshipCode(bodyUpdateRelative.relationship_code);
                relative.relationship = relationship;
            }
            Object.assign(relative, bodyUpdateRelative);
            const savedRelative = await this.relativeRepo.save(relative);
            return _relativesmapper.RelativesMapper.toRelativeResponseDto(savedRelative);
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Số điện thoại đã tồn tại trong hệ thống!');
            }
            throw error;
        }
    }
    async remove(userId, relativeId) {
        const relative = await this.findOwnedByUserId(userId, relativeId);
        const response = _relativesmapper.RelativesMapper.toRelativeResponseDto(relative);
        await this.relativeRepo.softDelete(relativeId);
        return response;
    }
    async getRelativeDetail(userId, relativeId) {
        const relative = await this.findOwnedByUserId(userId, relativeId);
        return _relativesmapper.RelativesMapper.toRelativeResponseDto(relative);
    }
    async isRelativeExists(userId, fullname, relationship_code, phone) {
        const relative = await this.relativeRepo.findOne({
            where: {
                user: {
                    id: userId
                },
                fullname: (0, _typeorm1.ILike)(fullname),
                relationship: {
                    relationship_code: relationship_code
                },
                phone: phone
            }
        });
        return !!relative;
    }
    async isRelativeExistsByRelativeId(userId, relativeId) {
        const relative = await this.relativeRepo.findOne({
            where: {
                id: relativeId,
                user: {
                    id: userId
                }
            }
        });
        return !!relative;
    }
    async numberOfRelativesByUserId(userId) {
        const count = await this.relativeRepo.count({
            where: {
                user: {
                    id: userId
                }
            }
        });
        return count;
    }
    async findOwnedByUserIdTransaction(manager, userId, relativeId) {
        const relative = await manager.findOne(_relativeentity.default, {
            where: {
                id: relativeId,
                user: {
                    id: userId
                }
            },
            relations: [
                'relationship',
                'health_profile',
                'user'
            ]
        });
        if (!relative) {
            throw new _common.NotFoundException('Người thân không tồn tại hoặc không thuộc quyền quản lý của bạn.');
        }
        return relative;
    }
    baseRelativesQuery() {
        return this.relativeRepo.createQueryBuilder('relative').leftJoinAndSelect('relative.user', 'user').leftJoinAndSelect('relative.relationship', 'relationship').select([
            'relative.id',
            'relative.fullname',
            'relative.phone',
            'relative.dob',
            'relative.gender',
            'relative.created_at',
            'relationship.relationship_name',
            'relationship.relationship_code'
        ]);
    }
    constructor(relativeRepo, usersService, relationshipsService, dataSource){
        this.relativeRepo = relativeRepo;
        this.usersService = usersService;
        this.relationshipsService = relationshipsService;
        this.dataSource = dataSource;
    }
};
RelativesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_relativeentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _relationshipsservice.RelationshipsService === "undefined" ? Object : _relationshipsservice.RelationshipsService,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], RelativesService);

//# sourceMappingURL=relatives.service.js.map