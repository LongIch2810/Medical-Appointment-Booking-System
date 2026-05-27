"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthProfileResponseDto", {
    enumerable: true,
    get: function() {
        return HealthProfileResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _relativeResponsedto = require("../../../relatives/dto/response/relativeResponse.dto");
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
let HealthProfileResponseDto = class HealthProfileResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "weight", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "height", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "blood_type", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "medical_history", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "allergies", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "heart_rate", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "blood_pressure", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "glucose_level", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], HealthProfileResponseDto.prototype, "cholesterol_level", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "medications", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "vaccinations", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], HealthProfileResponseDto.prototype, "smoking", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], HealthProfileResponseDto.prototype, "alcohol_consumption", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "exercise_frequency", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], HealthProfileResponseDto.prototype, "last_checkup_date", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_relativeResponsedto.RelativeResponseDto),
    _ts_metadata("design:type", typeof _relativeResponsedto.RelativeResponseDto === "undefined" ? Object : _relativeResponsedto.RelativeResponseDto)
], HealthProfileResponseDto.prototype, "patient", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], HealthProfileResponseDto.prototype, "updated_at", void 0);
HealthProfileResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], HealthProfileResponseDto);

//# sourceMappingURL=healthProfileResponse.dto.js.map