"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersModule", {
    enumerable: true,
    get: function() {
        return UsersModule;
    }
});
const _common = require("@nestjs/common");
const _usersservice = require("./users.service");
const _userscontroller = require("./users.controller");
const _typeorm = require("@nestjs/typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _cloudinarymodule = require("../../uploads/cloudinary.module");
const _roleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/role.entity"));
const _userRoleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/userRole.entity"));
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
let UsersModule = class UsersModule {
};
UsersModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _userentity.default,
                _userRoleentity.default,
                _roleentity.default
            ]),
            _rediscachemodule.RedisCacheModule,
            _cloudinarymodule.CloudinaryModule
        ],
        providers: [
            _usersservice.UsersService
        ],
        controllers: [
            _userscontroller.UsersController
        ],
        exports: [
            _usersservice.UsersService
        ]
    })
], UsersModule);

//# sourceMappingURL=users.module.js.map