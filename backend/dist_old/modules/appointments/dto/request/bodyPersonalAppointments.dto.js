"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyPersonalAppointmentsDto", {
    enumerable: true,
    get: function() {
        return BodyPersonalAppointmentsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _paginationdto = require("../../../../common/dto/pagination.dto");
const _appointmentStatus = require("../../../../shared/enums/appointmentStatus");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyPersonalAppointmentsDto = class BodyPersonalAppointmentsDto extends _paginationdto.PaginationDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_appointmentStatus.AppointmentStatus),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof _appointmentStatus.AppointmentStatus === "undefined" ? Object : _appointmentStatus.AppointmentStatus)
], BodyPersonalAppointmentsDto.prototype, "appointmentStatus", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>Number(value)),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyPersonalAppointmentsDto.prototype, "relativeId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], BodyPersonalAppointmentsDto.prototype, "appointmentDate", void 0);

//# sourceMappingURL=bodyPersonalAppointments.dto.js.map