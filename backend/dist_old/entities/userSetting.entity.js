"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserSetting", {
    enumerable: true,
    get: function() {
        return UserSetting;
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
let UserSetting = class UserSetting {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], UserSetting.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], UserSetting.prototype, "is_notification_email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], UserSetting.prototype, "is_reminder_appoinments", void 0);
_ts_decorate([
    (0, _typeorm.OneToOne)(()=>_userentity.default, (u)=>u.user_setting, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'user_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], UserSetting.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserSetting.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserSetting.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UserSetting.prototype, "deleted_at", void 0);
UserSetting = _ts_decorate([
    (0, _typeorm.Entity)('user_settings')
], UserSetting);

//# sourceMappingURL=userSetting.entity.js.map