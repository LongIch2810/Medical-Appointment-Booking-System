"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _authservice = require("./auth.service");
const _authcontroller = require("./auth.controller");
const _usersmodule = require("../users/users.module");
const _localstrategy = require("./local.strategy");
const _passport = require("@nestjs/passport");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _jwtstrategy = require("./jwt.strategy");
const _refreshstrategy = require("./refresh.strategy");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _googlestrategy = require("./google.strategy");
const _bullmqmodule = require("../../bullmq/bullmq.module");
const _typeorm = require("@nestjs/typeorm");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
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
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _relativeentity.default,
                _healthProfileentity.default,
                _relationshipentity.default
            ]),
            _bullmqmodule.BullmqModule,
            _usersmodule.UsersModule,
            _passport.PassportModule,
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (configService)=>({
                        secret: configService.get('ACCESS_TOKEN_SECRET'),
                        signOptions: {
                            expiresIn: configService.get('JWT_EXPIRES')
                        }
                    })
            })
        ],
        providers: [
            _authservice.AuthService,
            _localstrategy.LocalStrategy,
            _jwtstrategy.JwtStrategy,
            _refreshstrategy.JwtRefreshStrategy,
            _rediscacheservice.RedisCacheService,
            _googlestrategy.GoogleStrategy
        ],
        controllers: [
            _authcontroller.AuthController
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map