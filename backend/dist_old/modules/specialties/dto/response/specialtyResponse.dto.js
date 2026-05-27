"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SpecialtyResponseDto", {
    enumerable: true,
    get: function() {
        return SpecialtyResponseDto;
    }
});
const _classtransformer = require("class-transformer");
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
let SpecialtyResponseDto = class SpecialtyResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], SpecialtyResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "name", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "slug", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "img_url", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], SpecialtyResponseDto.prototype, "updated_at", void 0);
SpecialtyResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], SpecialtyResponseDto);

//# sourceMappingURL=specialtyResponse.dto.js.map