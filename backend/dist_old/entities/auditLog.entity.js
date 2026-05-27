"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLog", {
    enumerable: true,
    get: function() {
        return AuditLog;
    }
});
const _typeorm = require("typeorm");
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
let AuditLog = class AuditLog {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], AuditLog.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "entity_name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'jsonb',
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], AuditLog.prototype, "old_data", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'jsonb',
        nullable: true
    }),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], AuditLog.prototype, "new_data", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "endpoint", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], AuditLog.prototype, "method", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int',
        nullable: false
    }),
    _ts_metadata("design:type", Number)
], AuditLog.prototype, "status_code", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], AuditLog.prototype, "is_success", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], AuditLog.prototype, "error_message", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], AuditLog.prototype, "ip_address", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], AuditLog.prototype, "user_agent", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int'
    }),
    _ts_metadata("design:type", Number)
], AuditLog.prototype, "duration_ms", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_userentity.default, (u)=>u.auditLogs, {
        nullable: true,
        onDelete: 'SET NULL'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'user_id'
    }),
    _ts_metadata("design:type", Object)
], AuditLog.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], AuditLog.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], AuditLog.prototype, "updated_at", void 0);
AuditLog = _ts_decorate([
    (0, _typeorm.Entity)()
], AuditLog);

//# sourceMappingURL=auditLog.entity.js.map