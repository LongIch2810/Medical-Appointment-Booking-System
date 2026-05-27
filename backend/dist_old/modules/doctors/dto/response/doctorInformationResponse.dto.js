"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorInformationResponseDto", {
    enumerable: true,
    get: function() {
        return DoctorInformationResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _specialtyResponsedto = require("../../../specialties/dto/response/specialtyResponse.dto");
const _userResponsedto = require("../../../users/dto/response/userResponse.dto");
const _doctorLevel = require("../../../../shared/enums/doctorLevel");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DoctorInformationResponseDto = class DoctorInformationResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorInformationResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_userResponsedto.UserResponseDto),
    _ts_metadata("design:type", typeof _userResponsedto.UserResponseDto === "undefined" ? Object : _userResponsedto.UserResponseDto)
], DoctorInformationResponseDto.prototype, "user", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], DoctorInformationResponseDto.prototype, "experience", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorInformationResponseDto.prototype, "about_me", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], DoctorInformationResponseDto.prototype, "workplace", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _doctorLevel.DoctorLevel === "undefined" ? Object : _doctorLevel.DoctorLevel)
], DoctorInformationResponseDto.prototype, "doctor_level", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_specialtyResponsedto.SpecialtyResponseDto),
    _ts_metadata("design:type", typeof _specialtyResponsedto.SpecialtyResponseDto === "undefined" ? Object : _specialtyResponsedto.SpecialtyResponseDto)
], DoctorInformationResponseDto.prototype, "specialty", void 0);
DoctorInformationResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], DoctorInformationResponseDto);

//# sourceMappingURL=doctorInformationResponse.dto.js.map