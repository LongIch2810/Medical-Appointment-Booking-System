"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthProfileService", {
    enumerable: true,
    get: function() {
        return HealthProfileService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _relativesservice = require("../relatives/relatives.service");
const _usersservice = require("../users/users.service");
const _healthprofilemapper = require("./health-profile.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
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
let HealthProfileService = class HealthProfileService {
    async create(userId, relativeId) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const relative = await this.relativesService.findOwnedByUserId(userId, relativeId);
        if (relative.health_profile) {
            throw new _common.ConflictException('Hồ sơ sức khỏe đã tồn tại trong hệ thống. Vui lòng dùng tính năng Cập nhật.');
        }
        const createdHealthProfile = this.healthProfileRepo.create({
            patient: {
                id: relativeId
            }
        });
        const newHealthProfile = await this.healthProfileRepo.save(createdHealthProfile);
        return _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDto(newHealthProfile);
    }
    async update(userId, relativeId, bodyUpdateHealthProfile) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const relative = await this.relativesService.findOwnedByUserId(userId, relativeId);
        if (!relative.health_profile) {
            throw new _common.ConflictException('Bệnh nhân này đang không có hồ sơ sức khỏe. Vui lòng liên hệ Admin.');
        }
        Object.assign(relative.health_profile, bodyUpdateHealthProfile);
        const updatedHealthProfile = await this.healthProfileRepo.save(relative.health_profile);
        return _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDto(updatedHealthProfile);
    }
    async getHealthProfile(userId, relativeId) {
        await this.relativesService.findOwnedByUserId(userId, relativeId);
        const healthProfile = await this.baseHealthProfileQuery().where('relative.id = :relativeId', {
            relativeId
        }).getOne();
        if (!healthProfile) {
            throw new _common.NotFoundException('Hồ sơ sức khỏe không tồn tại.');
        }
        return _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
    }
    async listHealthProfilesByUserId(userId, objectFilters) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        let { page, limit, arrange, search } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseHealthProfileQuery().where('user.id = :userId', {
            userId
        }).orderBy('health_profile.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (search) {
            query.where('LOWER(relative.fullname) LIKE LOWER(:search)', {
                search: `%${search}%`
            });
            query.orWhere('relative.phone LIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('LOWER(user.fullname) LIKE LOWER(:search)', {
                search: `%${search}%`
            });
        }
        const [healthProfiles, total] = await query.skip(skip).take(limit).getManyAndCount();
        return new _paginationResultdto.PaginationResultDto('healthProfiles', _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles), total, page, limit);
    }
    async filterAndPagination(objectFilters) {
        let { page, limit, search, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseHealthProfileQuery().orderBy('health_profile.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (search) {
            query.where('LOWER(relative.fullname) LIKE LOWER(:search)', {
                search: `%${search}%`
            });
            query.orWhere('relative.phone LIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('LOWER(user.fullname) LIKE LOWER(:search)', {
                search: `%${search}%`
            });
        }
        const [healthProfiles, total] = await query.skip(skip).take(limit).getManyAndCount();
        return new _paginationResultdto.PaginationResultDto('healthProfiles', _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles), total, page, limit);
    }
    async getHealthProfileByRelativeId(userId, relativeId) {
        await this.relativesService.findOwnedByUserId(userId, relativeId);
        const healthProfile = await this.baseHealthProfileQuery().where('relative.id = :relativeId', {
            relativeId
        }).getOne();
        if (!healthProfile) {
            throw new _common.NotFoundException('Hồ sơ sức khỏe không tồn tại.');
        }
        return _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
    }
    async getPersonalHealthProfile(userId) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const healthProfile = await this.baseHealthProfileQuery().orderBy('health_profile.created_at', 'ASC').where('user.id = :userId', {
            userId
        }).getOne();
        if (!healthProfile) {
            throw new _common.NotFoundException('Hồ sơ sức khỏe không tồn tại.');
        }
        return _healthprofilemapper.HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
    }
    async numberOfHealthProfilesByUserId(userId) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const count = await this.healthProfileRepo.count({
            where: {
                patient: {
                    user: {
                        id: userId
                    }
                }
            }
        });
        return count;
    }
    baseHealthProfileQuery() {
        return this.healthProfileRepo.createQueryBuilder('health_profile').leftJoinAndSelect('health_profile.patient', 'relative').leftJoinAndSelect('relative.user', 'user').leftJoinAndSelect('relative.relationship', 'relationship');
    }
    constructor(healthProfileRepo, relativesService, redisCacheService, usersService){
        this.healthProfileRepo = healthProfileRepo;
        this.relativesService = relativesService;
        this.redisCacheService = redisCacheService;
        this.usersService = usersService;
    }
};
HealthProfileService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_healthProfileentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _relativesservice.RelativesService === "undefined" ? Object : _relativesservice.RelativesService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], HealthProfileService);

//# sourceMappingURL=health-profile.service.js.map