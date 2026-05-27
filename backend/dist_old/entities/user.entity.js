"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return User;
    }
});
const _typeorm = require("typeorm");
const _userRoleentity = /*#__PURE__*/ _interop_require_default(require("./userRole.entity"));
const _notificationentity = /*#__PURE__*/ _interop_require_default(require("./notification.entity"));
const _articleentity = /*#__PURE__*/ _interop_require_default(require("./article.entity"));
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("./doctor.entity"));
const _appointmententity = /*#__PURE__*/ _interop_require_default(require("./appointment.entity"));
const _conversationentity = /*#__PURE__*/ _interop_require_default(require("./conversation.entity"));
const _otpentity = /*#__PURE__*/ _interop_require_default(require("./otp.entity"));
const _messageentity = /*#__PURE__*/ _interop_require_default(require("./message.entity"));
const _channelMembersentity = /*#__PURE__*/ _interop_require_default(require("./channelMembers.entity"));
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("./relative.entity"));
const _auditLogentity = require("./auditLog.entity");
const _userSettingentity = require("./userSetting.entity");
const _complaintentity = /*#__PURE__*/ _interop_require_default(require("./complaint.entity"));
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
let User = class User {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], User.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: false
    }),
    _ts_metadata("design:type", String)
], User.prototype, "username", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: false
    }),
    _ts_metadata("design:type", String)
], User.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "password", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        unique: true,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "phone", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], User.prototype, "fullname", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "gender", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'date',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "date_of_birth", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "picture", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], User.prototype, "address", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "isAdmin", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "is_active", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], User.prototype, "is_locking", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_userRoleentity.default, (ur)=>ur.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "roles", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_notificationentity.default, (n)=>n.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "notifications", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_articleentity.default, (a)=>a.author),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "articles", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_doctorentity.default, (d)=>d.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "doctor", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_conversationentity.default, (c)=>c.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "messages", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_otpentity.default, (o)=>o.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "otps", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_messageentity.default, (m)=>m.sender),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "chat_messages", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_channelMembersentity.default, (cm)=>cm.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "channels", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_relativeentity.default, (r)=>r.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "relatives", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_appointmententity.default, (a)=>a.booked_by_user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "appointments", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_auditLogentity.AuditLog, (al)=>al.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "auditLogs", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_complaintentity.default, (complaint)=>complaint.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "complaints", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_userSettingentity.UserSetting, (us)=>us.user),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], User.prototype, "user_setting", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "deleted_at", void 0);
User = _ts_decorate([
    (0, _typeorm.Entity)('users')
], User);

//# sourceMappingURL=user.entity.js.map