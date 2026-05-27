"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Specialty;
    }
});
const _typeorm = require("typeorm");
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("./doctor.entity"));
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
let Specialty = class Specialty {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Specialty.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Specialty.prototype, "name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Specialty.prototype, "slug", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Specialty.prototype, "description", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], Specialty.prototype, "img_url", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_doctorentity.default, (d)=>d.specialty),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Specialty.prototype, "doctors", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Specialty.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Specialty.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Specialty.prototype, "deleted_at", void 0);
Specialty = _ts_decorate([
    (0, _typeorm.Entity)('specialties')
], Specialty);

//# sourceMappingURL=specialty.entity.js.map