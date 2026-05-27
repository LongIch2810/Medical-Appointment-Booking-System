"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TopicsService", {
    enumerable: true,
    get: function() {
        return TopicsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _topicentity = /*#__PURE__*/ _interop_require_default(require("../../entities/topic.entity"));
const _typeorm1 = require("typeorm");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _generateSlug = require("../../utils/generateSlug");
const _topicmapper = require("./topic.mapper");
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
let TopicsService = class TopicsService {
    async create(body) {
        try {
            const { name, description } = body;
            const slug = (0, _generateSlug.generateSlug)(name);
            const isTopicExistsByName = await this.isTopicExistsByName(name);
            if (isTopicExistsByName) {
                throw new _common.ConflictException('Topic đã tồn tại');
            }
            const isTopicExistsBySlug = await this.isTopicExistsBySlug(slug);
            if (isTopicExistsBySlug) {
                throw new _common.ConflictException('Topic đã tồn tại');
            }
            const topic = this.topicRepo.create({
                name,
                description,
                slug
            });
            const newTopic = await this.topicRepo.save(topic);
            return _topicmapper.TopicMapper.toTopicResponse(newTopic);
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Topic đã tồn tại');
            }
            throw error;
        }
    }
    async update(topicId, body) {
        const topic = await this.findById(topicId);
        const nextName = body.name?.trim();
        const nextDescription = body.description?.trim();
        if (nextName && nextName !== topic.name) {
            const slug = (0, _generateSlug.generateSlug)(nextName);
            const isTopicExistsByName = await this.topicRepo.createQueryBuilder('topic').where('LOWER(topic.name) = LOWER(:name)', {
                name: nextName
            }).andWhere('topic.id != :topicId', {
                topicId
            }).getOne();
            const isTopicExistsBySlug = await this.topicRepo.createQueryBuilder('topic').where('topic.slug = :slug', {
                slug
            }).andWhere('topic.id != :topicId', {
                topicId
            }).getOne();
            if (isTopicExistsByName || isTopicExistsBySlug) {
                throw new _common.ConflictException('Topic đã tồn tại');
            }
            topic.name = nextName;
            topic.slug = slug;
        }
        if (nextDescription) {
            topic.description = nextDescription;
        }
        return this.topicRepo.save(topic);
    }
    async filterAndPagination(objectFilters) {
        let { page, limit, search, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const cacheKey = `topics:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
        const cachedData = await this.redisCacheService.getData(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const query = this.topicRepo.createQueryBuilder('topic').where('topic.deleted_at is NULL').orderBy('topic.name', arrange.toUpperCase()).take(limit).skip(skip);
        if (search) {
            query.andWhere(`LOWER(topic.name) LIKE LOWER(:search)`, {
                search: `%${search}%`
            });
        }
        const [topics, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('topics', _topicmapper.TopicMapper.toTopicListResponse(topics), total, page, limit);
        await this.redisCacheService.setData(cacheKey, result);
        return result;
    }
    async isTopicExistsByName(name) {
        return this.topicRepo.findOne({
            where: {
                name
            }
        });
    }
    async isTopicExistsBySlug(slug) {
        return this.topicRepo.findOne({
            where: {
                slug
            }
        });
    }
    async findById(topicId) {
        const topic = await this.topicRepo.findOne({
            where: {
                id: topicId
            }
        });
        if (!topic) {
            throw new _common.NotFoundException('Topic không tồn tại');
        }
        return topic;
    }
    async getTopic(topicId) {
        const topic = await this.findById(topicId);
        return _topicmapper.TopicMapper.toTopicResponse(topic);
    }
    async remove(topicId) {
        await this.findById(topicId);
        await this.topicRepo.softDelete(topicId);
        return {
            message: 'Xóa topic thành công'
        };
    }
    constructor(topicRepo, redisCacheService){
        this.topicRepo = topicRepo;
        this.redisCacheService = redisCacheService;
    }
};
TopicsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_topicentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], TopicsService);

//# sourceMappingURL=topics.service.js.map