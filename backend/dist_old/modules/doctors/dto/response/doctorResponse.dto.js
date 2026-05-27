"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorResponseDto", {
    enumerable: true,
    get: function() {
        return DoctorResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _specialtyResponsedto = require("../../../specialties/dto/response/specialtyResponse.dto");
const _doctorLevel = require("../../../../shared/enums/doctorLevel");
const _formatDate = require("../../../../utils/formatDate");
const _groupSchedulesByDay = require("../../../../utils/groupSchedulesByDay");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DoctorResponseDto = class DoctorResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "fullname", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Object)
], DoctorResponseDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], DoctorResponseDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Object)
], DoctorResponseDto.prototype, "date_of_birth", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Object)
], DoctorResponseDto.prototype, "picture", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Object)
], DoctorResponseDto.prototype, "address", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorResponseDto.prototype, "experience", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "about_me", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "workplace", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _doctorLevel.DoctorLevel === "undefined" ? Object : _doctorLevel.DoctorLevel)
], DoctorResponseDto.prototype, "doctor_level", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorResponseDto.prototype, "user_id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>Number(value ?? 0)),
    _ts_metadata("design:type", Number)
], DoctorResponseDto.prototype, "avg_rating", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>Number(value ?? 0)),
    _ts_metadata("design:type", Number)
], DoctorResponseDto.prototype, "appointments_completed", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], DoctorResponseDto.prototype, "isOutstanding", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_specialtyResponsedto.SpecialtyResponseDto),
    _ts_metadata("design:type", typeof _specialtyResponsedto.SpecialtyResponseDto === "undefined" ? Object : _specialtyResponsedto.SpecialtyResponseDto)
], DoctorResponseDto.prototype, "specialty", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ obj })=>{
        const source = obj;
        return (0, _groupSchedulesByDay.groupSchedulesByDay)(source.doctor_schedules ?? []);
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], DoctorResponseDto.prototype, "doctor_schedules", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], DoctorResponseDto.prototype, "updated_at", void 0);
DoctorResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], DoctorResponseDto);

//# sourceMappingURL=doctorResponse.dto.js.map