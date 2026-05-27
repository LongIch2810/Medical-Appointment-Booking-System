"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Relative;
    }
});
const _typeorm = require("typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("./user.entity"));
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("./healthProfile.entity"));
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("./relationship.entity"));
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
let Relative = class Relative {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Relative.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_userentity.default, (user)=>user.relatives, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'user_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Relative.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Relative.prototype, "fullname", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_relationshipentity.default, (rel)=>rel.relatives, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'relationship_code',
        referencedColumnName: 'relationship_code'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Relative.prototype, "relationship", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        unique: true,
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Relative.prototype, "phone", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'date',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Relative.prototype, "dob", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], Relative.prototype, "gender", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_healthProfileentity.default, (hp)=>hp.patient),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Relative.prototype, "health_profile", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_appointmententity.default, (a)=>a.patient),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Relative.prototype, "appointments", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Relative.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Relative.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Relative.prototype, "deleted_at", void 0);
Relative = _ts_decorate([
    (0, _typeorm.Entity)('relatives')
], Relative);

//# sourceMappingURL=relative.entity.js.map