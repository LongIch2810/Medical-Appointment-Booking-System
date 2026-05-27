"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthProfileModule", {
    enumerable: true,
    get: function() {
        return HealthProfileModule;
    }
});
const _common = require("@nestjs/common");
const _healthprofilecontroller = require("./health-profile.controller");
const _healthprofileservice = require("./health-profile.service");
const _typeorm = require("@nestjs/typeorm");
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _relativesmodule = require("../relatives/relatives.module");
const _usersmodule = require("../users/users.module");
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
let HealthProfileModule = class HealthProfileModule {
};
HealthProfileModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _healthProfileentity.default,
                _relativeentity.default
            ]),
            _rediscachemodule.RedisCacheModule,
            _relativesmodule.RelativesModule,
            _usersmodule.UsersModule
        ],
        controllers: [
            _healthprofilecontroller.HealthProfileController
        ],
        providers: [
            _healthprofileservice.HealthProfileService
        ],
        exports: [
            _healthprofileservice.HealthProfileService
        ]
    })
], HealthProfileModule);

//# sourceMappingURL=health-profile.module.js.map