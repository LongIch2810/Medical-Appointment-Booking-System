"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return DoctorSchedule;
    }
});
const _typeorm = require("typeorm");
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("./doctor.entity"));
const _dayOfWeek = require("../shared/enums/dayOfWeek");
const _appointmententity = /*#__PURE__*/ _interop_require_default(require("./appointment.entity"));
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
let DoctorSchedule = class DoctorSchedule {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], DoctorSchedule.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        nullable: false,
        enumName: 'day_of_week',
        enum: _dayOfWeek.DayOfWeek
    }),
    _ts_metadata("design:type", typeof _dayOfWeek.DayOfWeek === "undefined" ? Object : _dayOfWeek.DayOfWeek)
], DoctorSchedule.prototype, "day_of_week", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'time',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], DoctorSchedule.prototype, "start_time", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'time',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], DoctorSchedule.prototype, "end_time", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], DoctorSchedule.prototype, "is_active", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_appointmententity.default, (a)=>a.doctor_schedule),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], DoctorSchedule.prototype, "appointments", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_doctorentity.default, (d)=>d.doctor_schedules, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'doctor_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], DoctorSchedule.prototype, "doctor", void 0);
DoctorSchedule = _ts_decorate([
    (0, _typeorm.Entity)('doctor_schedules'),
    (0, _typeorm.Unique)('UQ_doctor_schedules', [
        'doctor',
        'day_of_week',
        'start_time',
        'end_time'
    ])
], DoctorSchedule);

//# sourceMappingURL=doctorSchedule.entity.js.map