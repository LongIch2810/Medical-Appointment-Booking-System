"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorScheduleResponseDto", {
    enumerable: true,
    get: function() {
        return DoctorScheduleResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _toMinutes = require("../../../../utils/toMinutes");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DoctorScheduleResponseDto = class DoctorScheduleResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorScheduleResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorScheduleResponseDto.prototype, "day_of_week", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _toMinutes.toHHMM)(value)),
    _ts_metadata("design:type", String)
], DoctorScheduleResponseDto.prototype, "start_time", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _toMinutes.toHHMM)(value)),
    _ts_metadata("design:type", String)
], DoctorScheduleResponseDto.prototype, "end_time", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], DoctorScheduleResponseDto.prototype, "is_active", void 0);
DoctorScheduleResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], DoctorScheduleResponseDto);

//# sourceMappingURL=doctorScheduleResponse.dto.js.map