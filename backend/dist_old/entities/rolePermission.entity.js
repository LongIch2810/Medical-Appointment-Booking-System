"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return RolePermission;
    }
});
const _typeorm = require("typeorm");
const _roleentity = /*#__PURE__*/ _interop_require_default(require("./role.entity"));
const _permissionentity = /*#__PURE__*/ _interop_require_default(require("./permission.entity"));
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
let RolePermission = class RolePermission {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], RolePermission.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_roleentity.default, (r)=>r.permissions, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'role_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], RolePermission.prototype, "role", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_permissionentity.default, (p)=>p.roles),
    (0, _typeorm.JoinColumn)({
        name: 'permission_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], RolePermission.prototype, "permission", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RolePermission.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RolePermission.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RolePermission.prototype, "deleted_at", void 0);
RolePermission = _ts_decorate([
    (0, _typeorm.Entity)('role_permissions'),
    (0, _typeorm.Unique)('UQ_role_permissions', [
        'role',
        'permission'
    ])
], RolePermission);

//# sourceMappingURL=rolePermission.entity.js.map