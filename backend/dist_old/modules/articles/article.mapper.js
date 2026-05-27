"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArticleMapper", {
    enumerable: true,
    get: function() {
        return ArticleMapper;
    }
});
const _articleResponsedto = require("./dto/response/articleResponse.dto");
const _classtransformer = require("class-transformer");
let ArticleMapper = class ArticleMapper {
    static toArticleResponseDto(article) {
        return (0, _classtransformer.plainToInstance)(_articleResponsedto.ArticleResponseDto, {
            ...article,
            tags: article.tags?.map((articleTag)=>articleTag.tag)
        }, {
            excludeExtraneousValues: true
        });
    }
    static toArticleResponseDtoList(articles) {
        return articles.map((article)=>this.toArticleResponseDto(article));
    }
};

//# sourceMappingURL=article.mapper.js.map