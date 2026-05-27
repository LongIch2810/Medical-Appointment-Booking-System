"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SystemConfig", {
    enumerable: true,
    get: function() {
        return SystemConfig;
    }
});
const _typeorm = require("typeorm");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SystemConfig = class SystemConfig {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], SystemConfig.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int',
        default: 60
    }),
    _ts_metadata("design:type", Number)
], SystemConfig.prototype, "reminder_appointment_before_minutes", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int',
        default: 60
    }),
    _ts_metadata("design:type", Number)
], SystemConfig.prototype, "reminder_update_health_profile_after_minutes", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], SystemConfig.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], SystemConfig.prototype, "updated_at", void 0);
SystemConfig = _ts_decorate([
    (0, _typeorm.Entity)('system_configs')
], SystemConfig);

//# sourceMappingURL=systemConfigs.entity.js.map