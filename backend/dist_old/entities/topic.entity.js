"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Topic;
    }
});
const _typeorm = require("typeorm");
const _articleentity = /*#__PURE__*/ _interop_require_default(require("./article.entity"));
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
let Topic = class Topic {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Topic.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false,
        unique: true
    }),
    _ts_metadata("design:type", String)
], Topic.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Topic.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Topic.prototype, "slug", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_articleentity.default, (a)=>a.topic),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Topic.prototype, "articles", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Topic.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Topic.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Topic.prototype, "deleted_at", void 0);
Topic = _ts_decorate([
    (0, _typeorm.Entity)('topics')
], Topic);

//# sourceMappingURL=topic.entity.js.map