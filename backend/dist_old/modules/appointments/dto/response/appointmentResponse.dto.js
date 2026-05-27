"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentResponseDto", {
    enumerable: true,
    get: function() {
        return AppointmentResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _doctorScheduleResponsedto = require("../../../doctor-schedules/dto/response/doctorScheduleResponse.dto");
const _doctorInformationResponsedto = require("../../../doctors/dto/response/doctorInformationResponse.dto");
const _examinationResultResponsedto = require("../../../examination-result/dto/response/examinationResultResponse.dto");
const _relativeResponsedto = require("../../../relatives/dto/response/relativeResponse.dto");
const _satisfactionRatingResponsedto = require("../../../satisfaction-rating/dto/response/satisfactionRatingResponse.dto");
const _userResponsedto = require("../../../users/dto/response/userResponse.dto");
const _appointmentStatus = require("../../../../shared/enums/appointmentStatus");
const _bookingMode = require("../../../../shared/enums/bookingMode");
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
let AppointmentResponseDto = class AppointmentResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], AppointmentResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], AppointmentResponseDto.prototype, "appointment_date", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _appointmentStatus.AppointmentStatus === "undefined" ? Object : _appointmentStatus.AppointmentStatus)
], AppointmentResponseDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _bookingMode.BookingMode === "undefined" ? Object : _bookingMode.BookingMode)
], AppointmentResponseDto.prototype, "booking_mode", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_doctorScheduleResponsedto.DoctorScheduleResponseDto),
    _ts_metadata("design:type", typeof _doctorScheduleResponsedto.DoctorScheduleResponseDto === "undefined" ? Object : _doctorScheduleResponsedto.DoctorScheduleResponseDto)
], AppointmentResponseDto.prototype, "doctor_schedule", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_relativeResponsedto.RelativeResponseDto),
    _ts_metadata("design:type", typeof _relativeResponsedto.RelativeResponseDto === "undefined" ? Object : _relativeResponsedto.RelativeResponseDto)
], AppointmentResponseDto.prototype, "patient", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_examinationResultResponsedto.ExaminationResultResponseDto),
    _ts_metadata("design:type", typeof _examinationResultResponsedto.ExaminationResultResponseDto === "undefined" ? Object : _examinationResultResponsedto.ExaminationResultResponseDto)
], AppointmentResponseDto.prototype, "examination_result", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_satisfactionRatingResponsedto.SatisfactionRatingResponseDto),
    _ts_metadata("design:type", typeof _satisfactionRatingResponsedto.SatisfactionRatingResponseDto === "undefined" ? Object : _satisfactionRatingResponsedto.SatisfactionRatingResponseDto)
], AppointmentResponseDto.prototype, "satisfaction_rating", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_userResponsedto.UserResponseDto),
    _ts_metadata("design:type", typeof _userResponsedto.UserResponseDto === "undefined" ? Object : _userResponsedto.UserResponseDto)
], AppointmentResponseDto.prototype, "booked_by_user", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_doctorInformationResponsedto.DoctorInformationResponseDto),
    _ts_metadata("design:type", typeof _doctorInformationResponsedto.DoctorInformationResponseDto === "undefined" ? Object : _doctorInformationResponsedto.DoctorInformationResponseDto)
], AppointmentResponseDto.prototype, "doctor", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], AppointmentResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], AppointmentResponseDto.prototype, "updated_at", void 0);
AppointmentResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], AppointmentResponseDto);

//# sourceMappingURL=appointmentResponse.dto.js.map