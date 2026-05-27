"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtRefreshStrategy", {
    enumerable: true,
    get: function() {
        return JwtRefreshStrategy;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _passport = require("@nestjs/passport");
const _passportjwt = require("passport-jwt");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, _passport.PassportStrategy)(_passportjwt.Strategy, 'jwt-refresh') {
    async validate(payload) {
        const { sub: userId, tokenId, sessionVersion, roles } = payload;
        const currentVersion = await this.redisService.getData(`session_version:${userId}`);
        if (sessionVersion !== currentVersion) {
            throw new _common.UnauthorizedException('Phiên đăng nhập không hợp lệ !');
        }
        const isBlacklisted = await this.redisService.getData(`blacklist:${tokenId}`);
        if (isBlacklisted) {
            throw new _common.UnauthorizedException('Token đã bị thu hồi !');
        }
        return {
            userId,
            tokenId,
            sessionVersion,
            roles
        };
    }
    constructor(configService, redisService){
        super({
            jwtFromRequest: _passportjwt.ExtractJwt.fromExtractors([
                (req)=>req?.cookies?.refreshToken
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('REFRESH_TOKEN_SECRET') || 'your_secret'
        }), this.redisService = redisService;
    }
};
JwtRefreshStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], JwtRefreshStrategy);

//# sourceMappingURL=refresh.strategy.js.map