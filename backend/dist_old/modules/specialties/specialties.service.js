"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SpecialtiesService", {
    enumerable: true,
    get: function() {
        return SpecialtiesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _specialtyentity = /*#__PURE__*/ _interop_require_default(require("../../entities/specialty.entity"));
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _typeorm1 = require("typeorm");
const _generateSlug = require("../../utils/generateSlug");
const _specialtiesmapper = require("./specialties.mapper");
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
let SpecialtiesService = class SpecialtiesService {
    async create(bodyCreateSpecialty) {
        try {
            const { description, name, img_url } = bodyCreateSpecialty;
            const slug = (0, _generateSlug.generateSlug)(name);
            const isSpecialtyExistsByName = await this.isSpecialtyExistsByName(name);
            const isSpecialtyExistsBySlug = await this.isSpecialtyExistsBySlug(slug);
            if (isSpecialtyExistsByName || isSpecialtyExistsBySlug) {
                throw new _common.ConflictException('Chuyên khoa đã tồn tại.');
            }
            if (!img_url) {
                throw new _common.BadRequestException('Ảnh chuyên khoa là bắt buộc.');
            }
            const newSpecialty = await this.specialtyRepo.save({
                description,
                name,
                slug,
                img_url
            });
            const specialtyDetail = await this.getSpecialtyDetail(newSpecialty.id);
            return specialtyDetail;
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Chuyên khoa đã tồn tại');
            }
            throw error;
        }
    }
    async update(specialtyId, bodyUpdateSpecialty) {
        const specialty = await this.findSpecialtyById(specialtyId);
        if (bodyUpdateSpecialty.name !== undefined && bodyUpdateSpecialty.name !== specialty.name) {
            const slug = (0, _generateSlug.generateSlug)(bodyUpdateSpecialty.name);
            const existedSpecialty = await this.specialtyRepo.createQueryBuilder('specialty').where('(LOWER(specialty.name) = LOWER(:name) OR specialty.slug = :slug)', {
                name: bodyUpdateSpecialty.name,
                slug
            }).andWhere('specialty.id != :specialtyId', {
                specialtyId
            }).getOne();
            if (existedSpecialty) {
                throw new _common.ConflictException('Chuyên khoa đã tồn tại.');
            }
            specialty.name = bodyUpdateSpecialty.name;
            specialty.slug = slug;
        }
        if (bodyUpdateSpecialty.description !== undefined) {
            specialty.description = bodyUpdateSpecialty.description;
        }
        if (bodyUpdateSpecialty.img_url !== undefined) {
            specialty.img_url = bodyUpdateSpecialty.img_url;
        }
        const updatedSpecialty = await this.specialtyRepo.save(specialty);
        return _specialtiesmapper.SpecialtiesMapper.toSpecialtyResponseDto(updatedSpecialty);
    }
    async delete(specialtyId) {
        const specialty = await this.specialtyRepo.findOne({
            where: {
                id: specialtyId
            }
        });
        if (!specialty) {
            throw new _common.NotFoundException('Chuyên khoa không tồn tại.');
        }
        await this.specialtyRepo.softDelete(specialtyId);
        const deletedSpecialty = await this.getSpecialtyDetail(specialtyId);
        return deletedSpecialty;
    }
    async getSpecialtyDetail(specialtyId) {
        const specialty = await this.findSpecialtyById(specialtyId);
        return _specialtiesmapper.SpecialtiesMapper.toSpecialtyResponseDto(specialty);
    }
    async filterAndPagination(objectFilter) {
        let { page, limit, search, arrange } = objectFilter;
        // const cacheKey = `specialties:page=${page}:limit=${limit}:filter=${objectFilter || {}}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.specialtyRepo.createQueryBuilder('specialty').where('specialty.deleted_at is NULL').orderBy('specialty.name', arrange.toUpperCase()).take(limit).skip(skip);
        if (search) {
            query.where('UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:search))', {
                search: search
            });
        }
        const [specialties, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('specialties', specialties, total, page, limit);
        // await this.redisCacheService.setData(cacheKey, result, 3600);
        return result;
    }
    async findSpecialtyById(specialtyId) {
        const specialty = await this.specialtyRepo.findOne({
            where: {
                id: specialtyId
            }
        });
        if (!specialty) {
            throw new _common.NotFoundException('Chuyên khoa không tồn tại.');
        }
        return specialty;
    }
    async isSpecialtyExistsByName(name) {
        const specialty = await this.specialtyRepo.findOne({
            where: {
                name
            }
        });
        return !!specialty;
    }
    async isSpecialtyExistsBySlug(slug) {
        const specialty = await this.specialtyRepo.findOne({
            where: {
                slug
            }
        });
        return !!specialty;
    }
    constructor(specialtyRepo, redisCacheService){
        this.specialtyRepo = specialtyRepo;
        this.redisCacheService = redisCacheService;
    }
};
SpecialtiesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_specialtyentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], SpecialtiesService);

//# sourceMappingURL=specialties.service.js.map