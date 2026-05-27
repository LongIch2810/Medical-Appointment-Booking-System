"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArticlesService", {
    enumerable: true,
    get: function() {
        return ArticlesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _articleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/article.entity"));
const _typeorm1 = require("typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _generateSlug = require("../../utils/generateSlug");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _topicentity = /*#__PURE__*/ _interop_require_default(require("../../entities/topic.entity"));
const _articleTagentity = /*#__PURE__*/ _interop_require_default(require("../../entities/articleTag.entity"));
const _tagentity = /*#__PURE__*/ _interop_require_default(require("../../entities/tag.entity"));
const _uploadFileproducer = require("../../bullmq/queues/uploadFile/uploadFile.producer");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _articlemapper = require("./article.mapper");
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
let ArticlesService = class ArticlesService {
    async create(userId, bodyCreateArticle, files) {
        const newArticle = await this.dataSource.transaction(async (manager)=>{
            const author = await manager.findOne(_userentity.default, {
                where: {
                    id: userId
                }
            });
            if (!author) throw new _common.NotFoundException('Người dùng không tồn tại.');
            const topic = await manager.findOne(_topicentity.default, {
                where: {
                    id: bodyCreateArticle.topic_id
                }
            });
            if (!topic) throw new _common.NotFoundException('Chủ đề không tồn tại.');
            const articleData = {
                ...bodyCreateArticle,
                slug: (0, _generateSlug.generateSlug)(bodyCreateArticle.title + Date.now()),
                author,
                topic
            };
            const createdArticle = manager.create(_articleentity.default, articleData);
            const newArticle = await manager.save(_articleentity.default, createdArticle);
            const tag_ids = bodyCreateArticle.tag_ids;
            if (tag_ids && tag_ids.length > 0) {
                const tags = await manager.find(_tagentity.default, {
                    where: {
                        id: (0, _typeorm1.In)(tag_ids)
                    }
                });
                if (tags.length !== tag_ids.length) throw new _common.NotFoundException('Một hoặc nhiều tag không tồn tại.');
                const articleTags = tag_ids.map((tagId)=>manager.create(_articleTagentity.default, {
                        article: newArticle,
                        tag: {
                            id: tagId
                        }
                    }));
                await manager.save(_articleTagentity.default, articleTags);
            }
            return newArticle;
        });
        await this.uploadFileProducer.uploadFilesArticle({
            articleId: newArticle.id,
            files
        });
        return _articlemapper.ArticleMapper.toArticleResponseDto(newArticle);
    }
    async updateArticle(articleId, bodyUpdateArticle) {
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId,
                is_approve: true
            }
        });
        if (!article) {
            throw new _common.NotFoundException('Bài viết không tồn tại.');
        }
        const fields = {
            ...bodyUpdateArticle,
            ...bodyUpdateArticle?.title && {
                slug: (0, _generateSlug.generateSlug)(bodyUpdateArticle.title + Date.now())
            }
        };
        await this.articleRepo.update(articleId, fields);
        await this.redisCacheService.delData(`article:${articleId}`);
        return {
            message: 'Cập nhật bài viết thành công'
        };
    }
    async deleteArticle(articleId) {
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId,
                is_approve: true
            }
        });
        if (!article) {
            throw new _common.NotFoundException('Bài viết không tồn tại.');
        }
        await this.articleRepo.softDelete(articleId);
        await this.redisCacheService.delData(`article:${articleId}`);
        return {
            message: 'Xóa bài biết thành công.'
        };
    }
    async getArticle(articleId) {
        const cacheKey = `article:${articleId}`;
        const cachedData = await this.redisCacheService.getData(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId,
                is_approve: true
            },
            relations: [
                'author',
                'tags',
                'tags.tag',
                'topic'
            ]
        });
        if (!article) {
            throw new _common.NotFoundException('Bài viết không tồn tại.');
        }
        await this.redisCacheService.setData(cacheKey, _articlemapper.ArticleMapper.toArticleResponseDto(article), 3600);
        return _articlemapper.ArticleMapper.toArticleResponseDto(article);
    }
    async approveArticle(articleId) {
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId
            }
        });
        if (!article) {
            throw new _common.NotFoundException('Bài viết không tồn tại.');
        }
        if (article.is_approve) {
            throw new _common.BadRequestException('Bài viết đã được phê duyệt.');
        }
        await this.articleRepo.update(articleId, {
            is_approve: true
        });
        return {
            message: 'Duyệt bài viết thành công.'
        };
    }
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { topic_slug, search, arrange } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        // const cacheKey = `articles:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        const query = this.articleRepo.createQueryBuilder('article').leftJoinAndSelect('article.author', 'author').leftJoinAndSelect('article.topic', 'topic').leftJoinAndSelect('article.tags', 'articleTag').leftJoinAndSelect('articleTag.tag', 'tag').where('article.is_approve = :is_approve', {
            is_approve: true
        }).andWhere('article.deleted_at IS NULL').orderBy('article.created_at', arrange.toUpperCase()).take(limit).skip(skip);
        const filters = [
            {
                condition: 'topic.slug = :topic_slug',
                value: topic_slug,
                key: 'topic_slug'
            },
            {
                condition: `(LOWER(article.title) LIKE LOWER(:search) 
      OR LOWER(author.fullname) LIKE LOWER(:search) 
      OR LOWER(topic.name) LIKE LOWER(:search) 
      OR LOWER(tag.name) LIKE LOWER(:search))`,
                value: search,
                key: 'search'
            }
        ];
        filters.forEach(({ condition, value, key })=>{
            if (value !== undefined && value !== null) {
                query.andWhere(condition, {
                    [key]: value
                });
            }
        });
        const [articles, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('articles', _articlemapper.ArticleMapper.toArticleResponseDtoList(articles), total, page, limit);
        // await this.redisCacheService.setData(cacheKey, result, 3600);
        return result;
    }
    //check xem bài viết tồn tại chưa (đã duyệt và chưa duyệt)
    async isArticleExists(articleId) {
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId
            },
            relations: [
                'author'
            ]
        });
        return !!article;
    }
    async updateFilesArticle(articleId, files) {
        const article = await this.articleRepo.findOne({
            where: {
                id: articleId
            },
            relations: [
                'author'
            ]
        });
        if (!article) {
            throw new _common.NotFoundException('Bài viết không tồn tại.');
        }
        const urls = files.map((file)=>({
                url: file.url,
                public_id: file.public_id
            }));
        await this.articleRepo.update(article.id, {
            img_urls: urls
        });
        article.img_urls = urls;
        return article;
    }
    async filterAndPaginationByDoctors(objectFilters) {
        let { page, limit } = objectFilters;
        const { topic_slug, search, arrange, author_id, is_approve } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        // const cacheKey = `articles:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        const query = this.articleRepo.createQueryBuilder('article').leftJoinAndSelect('article.author', 'author').leftJoinAndSelect('article.topic', 'topic').leftJoinAndSelect('article.tags', 'articleTag').leftJoinAndSelect('articleTag.tag', 'tag').where('article.is_approve = :is_approve', {
            is_approve
        }).andWhere('article.deleted_at IS NULL').orderBy('article.created_at', arrange.toUpperCase()).take(limit).skip(skip);
        const filters = [
            {
                condition: 'topic.slug = :topic_slug',
                value: topic_slug,
                key: 'topic_slug'
            },
            {
                condition: `(LOWER(article.title) LIKE LOWER(:search) 
      OR LOWER(author.fullname) LIKE LOWER(:search) 
      OR LOWER(topic.name) LIKE LOWER(:search) 
      OR LOWER(tag.name) LIKE LOWER(:search))`,
                value: search,
                key: 'search'
            },
            {
                condition: 'author.id = :author_id',
                value: author_id,
                key: 'author_id'
            }
        ];
        filters.forEach(({ condition, value, key })=>{
            if (value !== undefined && value !== null) {
                query.andWhere(condition, {
                    [key]: value
                });
            }
        });
        const [articles, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('articles', _articlemapper.ArticleMapper.toArticleResponseDtoList(articles), total, page, limit);
        // await this.redisCacheService.setData(cacheKey, result, 3600);
        return result;
    }
    constructor(articleRepo, redisCacheService, uploadFileProducer, dataSource){
        this.articleRepo = articleRepo;
        this.redisCacheService = redisCacheService;
        this.uploadFileProducer = uploadFileProducer;
        this.dataSource = dataSource;
    }
};
ArticlesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_articleentity.default)),
    _ts_param(2, (0, _common.Inject)((0, _common.forwardRef)(()=>_uploadFileproducer.UploadFileProducer))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService,
        typeof _uploadFileproducer.UploadFileProducer === "undefined" ? Object : _uploadFileproducer.UploadFileProducer,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], ArticlesService);

//# sourceMappingURL=articles.service.js.map