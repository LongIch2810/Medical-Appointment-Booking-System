"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, // @Unique('unique_doctor_schedule_date', [
//   'doctor_schedule_id',
//   'appointment_date',
// ])
// @Index('unique_doctor_schedule_date', ['doctorSchedule', 'appointmentDate'], {
//   unique: true,
//   where: `"status" IN ('PENDING', 'CONFIRMED') AND "deleted_at" IS NULL`,
// })
"default", {
    enumerable: true,
    get: function() {
        return Appointment;
    }
});
const _typeorm = require("typeorm");
const _examinationResultentity = /*#__PURE__*/ _interop_require_default(require("./examinationResult.entity"));
const _satisfactionRatingentity = /*#__PURE__*/ _interop_require_default(require("./satisfactionRating.entity"));
const _appointmentStatus = require("../shared/enums/appointmentStatus");
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("./doctorSchedule.entity"));
const _bookingMode = require("../shared/enums/bookingMode");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("./relative.entity"));
const _userentity = /*#__PURE__*/ _interop_require_default(require("./user.entity"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Appointment = class Appointment {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Appointment.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'date',
        nullable: false
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Appointment.prototype, "appointment_date", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        default: _appointmentStatus.AppointmentStatus.PENDING,
        enumName: 'appointment_status',
        enum: _appointmentStatus.AppointmentStatus
    }),
    _ts_metadata("design:type", typeof _appointmentStatus.AppointmentStatus === "undefined" ? Object : _appointmentStatus.AppointmentStatus)
], Appointment.prototype, "status", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        default: _bookingMode.BookingMode.USER_SELECT,
        enumName: 'booking_mode',
        enum: _bookingMode.BookingMode
    }),
    _ts_metadata("design:type", typeof _bookingMode.BookingMode === "undefined" ? Object : _bookingMode.BookingMode)
], Appointment.prototype, "booking_mode", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_doctorScheduleentity.default, (ds)=>ds.appointments, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'doctor_schedule_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Appointment.prototype, "doctor_schedule", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_relativeentity.default, (r)=>r.appointments, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'patient_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Appointment.prototype, "patient", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_examinationResultentity.default, (er)=>er.appointment, {
        nullable: true
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Appointment.prototype, "examination_result", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_satisfactionRatingentity.default, (sr)=>sr.appointment, {
        nullable: true
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Appointment.prototype, "satisfaction_rating", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_userentity.default, (u)=>u.appointments, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'user_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Appointment.prototype, "booked_by_user", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Appointment.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Appointment.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Appointment.prototype, "deleted_at", void 0);
Appointment = _ts_decorate([
    (0, _typeorm.Entity)('appointments')
], Appointment);

//# sourceMappingURL=appointment.entity.js.map