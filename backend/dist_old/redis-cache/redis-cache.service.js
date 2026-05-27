"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RedisCacheService", {
    enumerable: true,
    get: function() {
        return RedisCacheService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _ioredis = /*#__PURE__*/ _interop_require_default(require("ioredis"));
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
let RedisCacheService = class RedisCacheService {
    async setData(key, value, ttl) {
        const parseValue = typeof value === 'string' ? value : JSON.stringify(value);
        ttl && ttl > 0 ? await this.client.set(key, parseValue, 'EX', ttl) : await this.client.set(key, parseValue);
    }
    async getData(key) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
    }
    async delData(key) {
        if (await this.client.exists(key)) {
            await this.client.del(key);
        }
    }
    async lRange(key, startIndex, endIndex) {
        return this.client.lrange(key, startIndex, endIndex);
    }
    async rPush(key, value) {
        return this.client.rpush(key, value);
    }
    async lPop(key) {
        return await this.client.exists(key) ? this.client.lpop(key) : null;
    }
    async incr(key) {
        return this.client.incr(key);
    }
    lRem(key, count, value) {
        return this.client.lrem(key, count, value);
    }
    constructor(configService){
        this.client = new _ioredis.default({
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASSWORD')
        });
    }
};
RedisCacheService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], RedisCacheService);

//# sourceMappingURL=redis-cache.service.js.map