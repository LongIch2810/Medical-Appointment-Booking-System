"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Doctor;
    }
});
const _typeorm = require("typeorm");
const _specialtyentity = /*#__PURE__*/ _interop_require_default(require("./specialty.entity"));
const _userentity = /*#__PURE__*/ _interop_require_default(require("./user.entity"));
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("./doctorSchedule.entity"));
const _doctorLevel = require("../shared/enums/doctorLevel");
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
let Doctor = class Doctor {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Doctor.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int',
        nullable: false
    }),
    _ts_metadata("design:type", Number)
], Doctor.prototype, "experience", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Doctor.prototype, "about_me", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Doctor.prototype, "workplace", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: _doctorLevel.DoctorLevel,
        default: _doctorLevel.DoctorLevel.DK,
        name: 'doctor_level'
    }),
    _ts_metadata("design:type", typeof _doctorLevel.DoctorLevel === "undefined" ? Object : _doctorLevel.DoctorLevel)
], Doctor.prototype, "doctor_level", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_specialtyentity.default, (s)=>s.doctors),
    (0, _typeorm.JoinColumn)({
        name: 'specialty_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Doctor.prototype, "specialty", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_userentity.default, (u)=>u.doctor),
    (0, _typeorm.JoinColumn)({
        name: 'user_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Doctor.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_doctorScheduleentity.default, (ds)=>ds.doctor),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Doctor.prototype, "doctor_schedules", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Doctor.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Doctor.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Doctor.prototype, "deleted_at", void 0);
Doctor = _ts_decorate([
    (0, _typeorm.Entity)('doctors')
], Doctor);

//# sourceMappingURL=doctor.entity.js.map