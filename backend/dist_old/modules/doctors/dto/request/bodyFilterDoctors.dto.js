"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyFilterDoctorsDto", {
    enumerable: true,
    get: function() {
        return BodyFilterDoctorsDto;
    }
});
const _classvalidator = require("class-validator");
const _paginationdto = require("../../../../common/dto/pagination.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyFilterDoctorsDto = class BodyFilterDoctorsDto extends _paginationdto.PaginationDto {
};
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyFilterDoctorsDto.prototype, "specialty_id", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.Min)(3),
    _ts_metadata("design:type", Number)
], BodyFilterDoctorsDto.prototype, "min_experience", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.Max)(50),
    _ts_metadata("design:type", Number)
], BodyFilterDoctorsDto.prototype, "max_experience", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyFilterDoctorsDto.prototype, "workplace", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyFilterDoctorsDto.prototype, "area", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyFilterDoctorsDto.prototype, "search", void 0);

//# sourceMappingURL=bodyFilterDoctors.dto.js.map