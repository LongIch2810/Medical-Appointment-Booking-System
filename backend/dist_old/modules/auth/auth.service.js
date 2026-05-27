/* eslint-disable */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _usersservice = require("../users/users.service");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _uuid = require("uuid");
const _emailproducer = require("../../bullmq/queues/email/email.producer");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _typeorm = require("typeorm");
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
const _usersmapper = require("../users/users.mapper");
const _roleName = require("../../shared/enums/roleName");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
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
let AuthService = class AuthService {
    async validateUser(usernameOrEmail, password) {
        const user = await this.usersService.findByUsernameOrEmail(usernameOrEmail);
        if (user && await _bcryptjs.compare(password, user.password)) {
            const roles = user.roles.map((r)=>r.role.role_name);
            return {
                userId: user.id,
                roles
            };
        }
        return null;
    }
    async login(req) {
        const { userId, roles } = req.user;
        if (!roles.includes(_roleName.RoleName.PATIENT)) {
            throw new _common.ForbiddenException('Bạn không có quyền truy cập!');
        }
        const sessionVersion = await this.redisService.getData(`session_version:${userId}`) || 1;
        await this.redisService.setData(`session_version:${userId}`, sessionVersion);
        const tokenId = (0, _uuid.v4)();
        const payload = {
            sub: userId,
            roles,
            tokenId,
            sessionVersion
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRE')
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRE')
        });
        const refreshTokenDecoded = this.jwtService.decode(refreshToken);
        const sessions = await this.redisService.lRange(`refresh_tokens:${userId}`, 0, -1);
        if (sessions.length > 3) {
            const oldest = JSON.parse(sessions[0]);
            await this.redisService.lPop(`refresh_tokens:${userId}`);
            const now = Math.floor(Date.now() / 1000);
            const ttl = oldest.exp ? oldest.exp - now : 7 * 24 * 60 * 60;
            await this.redisService.setData(`blacklist:${oldest.tokenId}`, true, ttl);
        }
        await this.redisService.rPush(`refresh_tokens:${userId}`, JSON.stringify({
            tokenId,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            issuedAt: new Date().toISOString(),
            exp: refreshTokenDecoded.exp
        }));
        await this.usersService.updateUserField(userId, 'is_active', true);
        return {
            accessToken,
            refreshToken
        };
    }
    async loginAdministrator(req) {
        const { userId, roles } = req.user;
        if (roles.length === 1 && roles.includes(_roleName.RoleName.PATIENT)) {
            throw new _common.ForbiddenException('Bạn không có quyền truy cập!');
        }
        const sessionVersion = await this.redisService.getData(`session_version:${userId}`) || 1;
        await this.redisService.setData(`session_version:${userId}`, sessionVersion);
        const tokenId = (0, _uuid.v4)();
        const payload = {
            sub: userId,
            roles,
            tokenId,
            sessionVersion
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRE')
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRE')
        });
        const refreshTokenDecoded = this.jwtService.decode(refreshToken);
        const sessions = await this.redisService.lRange(`refresh_tokens:${userId}`, 0, -1);
        if (sessions.length > 3) {
            const oldest = JSON.parse(sessions[0]);
            await this.redisService.lPop(`refresh_tokens:${userId}`);
            const now = Math.floor(Date.now() / 1000);
            const ttl = oldest.exp ? oldest.exp - now : 7 * 24 * 60 * 60;
            await this.redisService.setData(`blacklist:${oldest.tokenId}`, true, ttl);
        }
        await this.redisService.rPush(`refresh_tokens:${userId}`, JSON.stringify({
            tokenId,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            issuedAt: new Date().toISOString(),
            exp: refreshTokenDecoded.exp
        }));
        await this.usersService.updateUserField(userId, 'is_active', true);
        return {
            accessToken,
            refreshToken
        };
    }
    async register(dataRegister) {
        try {
            return await this.dataSource.transaction(async (manager)=>{
                const { username, email, password, fullname } = dataRegister;
                const hashedPassword = await _bcryptjs.hash(password, 10);
                const newUser = await this.usersService.createUser(manager, username, email, fullname, hashedPassword);
                const relationship = await manager.findOne(_relationshipentity.default, {
                    where: {
                        relationship_code: 'ban_than'
                    }
                });
                if (!relationship) {
                    throw new _common.NotFoundException('Mối quan hệ mặc định không tồn tại.');
                }
                const newRelative = manager.create(_relativeentity.default, {
                    user: newUser,
                    fullname,
                    relationship
                });
                await manager.save(_relativeentity.default, newRelative);
                const newHealth = manager.create(_healthProfileentity.default, {
                    patient: newRelative
                });
                await manager.save(_healthProfileentity.default, newHealth);
                await this.emailProducer.sendWelcome(email, username);
                return _usersmapper.UsersMapper.toUserProfileResponse(newUser);
            });
        } catch (error) {
            throw error;
        }
    }
    async logout(req) {
        const refreshToken = req.cookies.refreshToken;
        const decoded = this.jwtService.decode(refreshToken);
        if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
            throw new _common.UnauthorizedException('Token không hợp lệ!');
        }
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp ? decoded.exp - now : 7 * 24 * 60 * 60;
        await this.redisService.setData(`blacklist:${decoded.tokenId}`, true, ttl);
        const list = await this.redisService.lRange(`refresh_tokens:${decoded.sub}`, 0, -1);
        const match = list.find((t)=>JSON.parse(t).tokenId === decoded.tokenId);
        if (!match) throw new _common.UnauthorizedException('Token không hợp lệ!');
        await this.redisService.lRem(`refresh_tokens:${decoded.sub}`, 0, match);
        await this.usersService.updateUserField(decoded.sub, 'is_active', false);
        return {
            message: 'Đăng xuất thành công!'
        };
    }
    async logoutAll(req) {
        const refreshToken = req.cookies.refreshToken;
        const decoded = this.jwtService.decode(refreshToken);
        if (!decoded || typeof decoded !== 'object' || !decoded.tokenId) {
            throw new _common.UnauthorizedException('Token không hợp lệ!');
        }
        await this.redisService.incr(`session_version:${decoded.sub}`);
        await this.redisService.delData(`refresh_tokens:${decoded.sub}`);
        await this.usersService.updateUserField(decoded.sub, 'is_active', false);
        return {
            message: 'Đăng xuất tất cả các thiết bị thành công!'
        };
    }
    async refresh(req, payload) {
        const { userId, tokenId, sessionVersion, roles } = payload;
        const isBlacklisted = await this.redisService.getData(`blacklist:${tokenId}`);
        if (isBlacklisted) {
            throw new _common.UnauthorizedException('Token đã bị thu hồi!');
        }
        const list = await this.redisService.lRange(`refresh_tokens:${userId}`, 0, -1);
        const match = list.find((t)=>JSON.parse(t).tokenId === tokenId);
        if (!match) throw new _common.UnauthorizedException('Token không hợp lệ!');
        const newTokenId = (0, _uuid.v4)();
        const newPayload = {
            sub: userId,
            tokenId: newTokenId,
            sessionVersion: sessionVersion,
            roles
        };
        await this.redisService.lRem(`refresh_tokens:${userId}`, 0, match);
        const now = Math.floor(Date.now() / 1000);
        const parsed = JSON.parse(match);
        const ttl = parsed.exp ? parsed.exp - now : 7 * 24 * 60 * 60;
        await this.redisService.setData(`blacklist:${tokenId}`, true, ttl);
        const newAccessToken = this.jwtService.sign(newPayload, {
            secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRE')
        });
        const newRefreshToken = this.jwtService.sign(newPayload, {
            secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRE')
        });
        const newDecoded = this.jwtService.decode(newRefreshToken);
        await this.redisService.rPush(`refresh_tokens:${userId}`, JSON.stringify({
            tokenId: newTokenId,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            issuedAt: new Date().toISOString(),
            exp: newDecoded.exp
        }));
        return {
            newAccessToken,
            newRefreshToken
        };
    }
    async setNewPassword(email, newPassword) {
        const user = await this.usersService.findByUsernameOrEmail(email);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        const hashedPassword = await _bcryptjs.hash(newPassword, 10);
        await this.usersService.updateUserField(user.id, 'password', hashedPassword);
        await this.redisService.incr(`session_version:${user.id}`);
        await this.redisService.delData(`refresh_tokens:${user.id}`);
        return {
            message: 'Đặt lại mật khẩu thành công.'
        };
    }
    constructor(usersService, jwtService, redisService, emailProducer, configService, dataSource){
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.redisService = redisService;
        this.emailProducer = emailProducer;
        this.configService = configService;
        this.dataSource = dataSource;
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService,
        typeof _emailproducer.EmailProducer === "undefined" ? Object : _emailproducer.EmailProducer,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map