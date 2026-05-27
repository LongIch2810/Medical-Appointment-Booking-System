"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WsCookieAuthGuard", {
    enumerable: true,
    get: function() {
        return WsCookieAuthGuard;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
require("dotenv/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let WsCookieAuthGuard = class WsCookieAuthGuard {
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = this._extractTokenFromCookie(client);
        console.log('>>> token: ', token);
        if (!token) {
            client.emit('ws-error', {
                code: 401,
                message: 'Invalid token'
            });
            return false;
        }
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.ACCESS_TOKEN_SECRET || 'secret'
            });
            client.data.user = payload;
            client.data.token = token;
            return true;
        } catch (err) {
            client.emit('ws-error', {
                code: 401,
                message: 'Invalid token'
            });
            return false;
        }
    }
    constructor(jwtService){
        this.jwtService = jwtService;
        this._extractTokenFromCookie = (client)=>{
            try {
                const cookies = client?.handshake?.headers?.cookie;
                if (!cookies) return null;
                console.log('>>> cookies : ', cookies);
                const cookieArray = cookies.split('; ');
                console.log('>>> cookieArray : ', cookieArray);
                const cookieMap = cookieArray.reduce((acc, cookie)=>{
                    const [key, value] = cookie.split('=');
                    if (key && value) acc[key.trim()] = decodeURIComponent(value);
                    return acc;
                }, {});
                console.log('>>> cookieMap : ', cookieMap);
                return cookieMap['accessToken'] || null;
            } catch (error) {
                return null;
            }
        };
    }
};
WsCookieAuthGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService
    ])
], WsCookieAuthGuard);

//# sourceMappingURL=wsCookieAuth.guard.js.map