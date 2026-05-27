"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolePermissionModule", {
    enumerable: true,
    get: function() {
        return RolePermissionModule;
    }
});
const _common = require("@nestjs/common");
const _rolepermissionservice = require("./role-permission.service");
const _typeorm = require("@nestjs/typeorm");
const _permissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/permission.entity"));
const _roleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/role.entity"));
const _rolePermissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/rolePermission.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _rolepermissioncontroller = require("./role-permission.controller");
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
let RolePermissionModule = class RolePermissionModule {
};
RolePermissionModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _rolePermissionentity.default,
                _roleentity.default,
                _permissionentity.default
            ]),
            _rediscachemodule.RedisCacheModule
        ],
        controllers: [
            _rolepermissioncontroller.RolePermissionController
        ],
        providers: [
            _rolepermissionservice.RolePermissionService
        ],
        exports: [
            _rolepermissionservice.RolePermissionService
        ]
    })
], RolePermissionModule);

//# sourceMappingURL=role-permission.module.js.map