"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TagsService", {
    enumerable: true,
    get: function() {
        return TagsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _tagentity = /*#__PURE__*/ _interop_require_default(require("../../entities/tag.entity"));
const _typeorm1 = require("typeorm");
const _generateSlug = require("../../utils/generateSlug");
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
let TagsService = class TagsService {
    async create(body) {
        try {
            const name = body.name;
            const slug = (0, _generateSlug.generateSlug)(name);
            const existsTag = await this.isTagExistsByName(name);
            const existsSlug = await this.isTagExistsBySlug(slug);
            if (existsTag || existsSlug) {
                throw new _common.ConflictException('Tag đã tồn tại');
            }
            const createdTag = this.tagRepo.create({
                name,
                slug
            });
            const newTag = await this.tagRepo.save(createdTag);
            return newTag;
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Tag đã tồn tại');
            }
            throw error;
        }
    }
    async update(tagId, body) {
        const tag = await this.findById(tagId);
        if (!body.name || body.name === tag.name) {
            return tag;
        }
        const name = body.name;
        const slug = (0, _generateSlug.generateSlug)(name);
        const existedTag = await this.tagRepo.createQueryBuilder('tag').where('LOWER(tag.name) = LOWER(:name)', {
            name
        }).andWhere('tag.id != :tagId', {
            tagId
        }).getOne();
        const existedSlug = await this.tagRepo.createQueryBuilder('tag').where('tag.slug = :slug', {
            slug
        }).andWhere('tag.id != :tagId', {
            tagId
        }).getOne();
        if (existedTag || existedSlug) {
            throw new _common.ConflictException('Tag đã tồn tại');
        }
        tag.name = name;
        tag.slug = slug;
        return this.tagRepo.save(tag);
    }
    async filterAndPagination(objectFilters) {
        let { page, limit, search, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.tagRepo.createQueryBuilder('tag').orderBy('tag.name', arrange.toUpperCase()).skip(skip).take(limit);
        if (search) {
            query.where('tag.name ILIKE :search', {
                search: `%${search}%`
            });
            query.orWhere('tag.slug ILIKE :search', {
                search: `%${search}%`
            });
        }
        const [tags, total] = await query.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return {
            tags,
            total,
            page,
            totalPages,
            limit
        };
    }
    async isTagExistsByName(name) {
        const tag = await this.tagRepo.findOne({
            where: {
                name: (0, _typeorm1.ILike)(name)
            }
        });
        return !!tag;
    }
    async isTagExistsBySlug(slug) {
        const tag = await this.tagRepo.findOne({
            where: {
                slug
            }
        });
        return !!tag;
    }
    async findById(tagId) {
        const tag = await this.tagRepo.findOne({
            where: {
                id: tagId
            }
        });
        if (!tag) {
            throw new _common.NotFoundException('Tag không tồn tại');
        }
        return tag;
    }
    async remove(tagId) {
        await this.findById(tagId);
        await this.tagRepo.softDelete(tagId);
        return {
            message: 'Xóa tag thành công'
        };
    }
    constructor(tagRepo){
        this.tagRepo = tagRepo;
    }
};
TagsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_tagentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], TagsService);

//# sourceMappingURL=tags.service.js.map