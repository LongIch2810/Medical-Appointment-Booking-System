"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyUpdateHealthProfileDto", {
    enumerable: true,
    get: function() {
        return BodyUpdateHealthProfileDto;
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
let BodyUpdateHealthProfileDto = class BodyUpdateHealthProfileDto {
};
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyUpdateHealthProfileDto.prototype, "weight", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyUpdateHealthProfileDto.prototype, "height", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "blood_type", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "medical_history", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "allergies", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyUpdateHealthProfileDto.prototype, "heart_rate", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "blood_pressure", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyUpdateHealthProfileDto.prototype, "glucose_level", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyUpdateHealthProfileDto.prototype, "cholesterol_level", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "medications", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "vaccinations", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], BodyUpdateHealthProfileDto.prototype, "smoking", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], BodyUpdateHealthProfileDto.prototype, "alcohol_consumption", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyUpdateHealthProfileDto.prototype, "exercise_frequency", void 0);
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], BodyUpdateHealthProfileDto.prototype, "last_checkup_date", void 0);

//# sourceMappingURL=bodyUpdateHealthProfile.dto.js.map