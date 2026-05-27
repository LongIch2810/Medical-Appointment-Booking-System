"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return ArticleTag;
    }
});
const _typeorm = require("typeorm");
const _articleentity = /*#__PURE__*/ _interop_require_default(require("./article.entity"));
const _tagentity = /*#__PURE__*/ _interop_require_default(require("./tag.entity"));
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
let ArticleTag = class ArticleTag {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], ArticleTag.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_articleentity.default, (a)=>a.tags),
    (0, _typeorm.JoinColumn)({
        name: 'article_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], ArticleTag.prototype, "article", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_tagentity.default, (t)=>t.articles),
    (0, _typeorm.JoinColumn)({
        name: 'tag_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], ArticleTag.prototype, "tag", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ArticleTag.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ArticleTag.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ArticleTag.prototype, "deleted_at", void 0);
ArticleTag = _ts_decorate([
    (0, _typeorm.Entity)('article_tags'),
    (0, _typeorm.Unique)('UQ_article_tags', [
        'article',
        'tag'
    ])
], ArticleTag);

//# sourceMappingURL=articleTag.entity.js.map