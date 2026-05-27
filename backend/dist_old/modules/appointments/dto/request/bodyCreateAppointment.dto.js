"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyCreateAppointmentDto", {
    enumerable: true,
    get: function() {
        return BodyCreateAppointmentDto;
    }
});
const _classvalidator = require("class-validator");
const _bookingMode = require("../../../../shared/enums/bookingMode");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyCreateAppointmentDto = class BodyCreateAppointmentDto {
};
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], BodyCreateAppointmentDto.prototype, "appointment_date", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], BodyCreateAppointmentDto.prototype, "doctor_schedule_id", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], BodyCreateAppointmentDto.prototype, "relative_id", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_bookingMode.BookingMode),
    _ts_metadata("design:type", typeof _bookingMode.BookingMode === "undefined" ? Object : _bookingMode.BookingMode)
], BodyCreateAppointmentDto.prototype, "booking_mode", void 0);

//# sourceMappingURL=bodyCreateAppointment.dto.js.map