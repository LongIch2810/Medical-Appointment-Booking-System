"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyCreateArticleDto", {
    enumerable: true,
    get: function() {
        return BodyCreateArticleDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyCreateArticleDto = class BodyCreateArticleDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.IsNotEmpty)({
        message: 'Tiêu đề không được để trống'
    }),
    (0, _classvalidator.IsString)({
        message: 'Tiêu đề phải là chuỗi'
    }),
    (0, _classvalidator.MinLength)(10, {
        message: 'Tiêu đề phải có ít nhất 10 ký tự'
    }),
    (0, _classvalidator.MaxLength)(200, {
        message: 'Tiêu đề không được vượt quá 200 ký tự'
    }),
    _ts_metadata("design:type", String)
], BodyCreateArticleDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.IsNotEmpty)({
        message: 'Nội dung không được để trống'
    }),
    (0, _classvalidator.IsString)({
        message: 'Nội dung phải là chuỗi'
    }),
    (0, _classvalidator.MinLength)(200, {
        message: 'Nội dung phải có ít nhất 200 ký tự'
    }),
    _ts_metadata("design:type", String)
], BodyCreateArticleDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.IsString)({
        message: 'Mô tả phải là chuỗi'
    }),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(30, {
        message: 'Tóm tắt phải có ít nhất 30 ký tự'
    }),
    (0, _classvalidator.MaxLength)(500, {
        message: 'Tóm tắt không được vượt quá 500 ký tự'
    }),
    _ts_metadata("design:type", String)
], BodyCreateArticleDto.prototype, "summary", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>{
        if (typeof value !== 'string') return value;
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) return parsed;
            const parsedSet = [
                ...new Set(parsed)
            ];
            return parsedSet.map((id)=>Number(id)).filter((id)=>!Number.isNaN(id));
        } catch  {
            return value;
        }
    }),
    (0, _classvalidator.IsArray)({
        message: 'Tags phải là mảng'
    }),
    (0, _classvalidator.ArrayMaxSize)(10, {
        message: 'Không được có quá 10 tags'
    }),
    (0, _classvalidator.IsNumber)({}, {
        each: true,
        message: 'Mỗi tag_id phải là số'
    }),
    _ts_metadata("design:type", Array)
], BodyCreateArticleDto.prototype, "tag_ids", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>Number(value)),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", Number)
], BodyCreateArticleDto.prototype, "topic_id", void 0);

//# sourceMappingURL=bodyCreateArticle.dto.js.map