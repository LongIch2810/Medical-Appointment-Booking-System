"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArticleResponseDto", {
    enumerable: true,
    get: function() {
        return ArticleResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _tagArticleResponsedto = require("../../../tags/dto/response/tagArticleResponse.dto");
const _topicResponsedto = require("../../../topics/dto/response/topicResponse.dto");
const _authorResponsedto = require("../../../users/dto/response/authorResponse.dto");
const _formatDate = require("../../../../utils/formatDate");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ArticleResponseDto = class ArticleResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], ArticleResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "summary", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "slug", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], ArticleResponseDto.prototype, "is_approve", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Array)
], ArticleResponseDto.prototype, "img_urls", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_authorResponsedto.AuthorResponseDto),
    _ts_metadata("design:type", typeof _authorResponsedto.AuthorResponseDto === "undefined" ? Object : _authorResponsedto.AuthorResponseDto)
], ArticleResponseDto.prototype, "author", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_topicResponsedto.TopicResponseDto),
    _ts_metadata("design:type", typeof _topicResponsedto.TopicResponseDto === "undefined" ? Object : _topicResponsedto.TopicResponseDto)
], ArticleResponseDto.prototype, "topic", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_tagArticleResponsedto.TagArticleResponseDto),
    _ts_metadata("design:type", Array)
], ArticleResponseDto.prototype, "tags", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], ArticleResponseDto.prototype, "updated_at", void 0);
ArticleResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], ArticleResponseDto);

//# sourceMappingURL=articleResponse.dto.js.map