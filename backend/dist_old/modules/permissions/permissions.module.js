"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermissionsModule", {
    enumerable: true,
    get: function() {
        return PermissionsModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _permissionentity = /*#__PURE__*/ _interop_require_default(require("../../entities/permission.entity"));
const _permissionscontroller = require("./permissions.controller");
const _permissionsservice = require("./permissions.service");
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
let PermissionsModule = class PermissionsModule {
};
PermissionsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _permissionentity.default
            ])
        ],
        controllers: [
            _permissionscontroller.PermissionsController
        ],
        providers: [
            _permissionsservice.PermissionsService
        ],
        exports: [
            _permissionsservice.PermissionsService
        ]
    })
], PermissionsModule);

//# sourceMappingURL=permissions.module.js.map