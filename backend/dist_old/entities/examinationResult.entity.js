"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return ExaminationResult;
    }
});
const _typeorm = require("typeorm");
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
let ExaminationResult = class ExaminationResult {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], ExaminationResult.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], ExaminationResult.prototype, "symptoms", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], ExaminationResult.prototype, "diagnosis", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], ExaminationResult.prototype, "treatment", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], ExaminationResult.prototype, "prescription", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_appointmententity.default, (a)=>a.examination_result, {
        nullable: false,
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'appointment_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], ExaminationResult.prototype, "appointment", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ExaminationResult.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ExaminationResult.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ExaminationResult.prototype, "deleted_at", void 0);
ExaminationResult = _ts_decorate([
    (0, _typeorm.Entity)('examination_result')
], ExaminationResult);

//# sourceMappingURL=examinationResult.entity.js.map