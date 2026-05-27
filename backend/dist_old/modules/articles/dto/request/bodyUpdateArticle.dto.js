"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyUpdateArticleDto", {
    enumerable: true,
    get: function() {
        return BodyUpdateArticleDto;
    }
});
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
let BodyUpdateArticleDto = class BodyUpdateArticleDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Length)(1, 255),
    _ts_metadata("design:type", String)
], BodyUpdateArticleDto.prototype, "title", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyUpdateArticleDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyUpdateArticleDto.prototype, "img_url", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Length)(1, 500),
    _ts_metadata("design:type", String)
], BodyUpdateArticleDto.prototype, "summary", void 0);

//# sourceMappingURL=bodyUpdateArticle.dto.js.map