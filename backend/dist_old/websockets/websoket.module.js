"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WebsocketModule", {
    enumerable: true,
    get: function() {
        return WebsocketModule;
    }
});
const _common = require("@nestjs/common");
const _websocketgateway = require("./websocket.gateway");
const _messagesmodule = require("../modules/messages/messages.module");
const _jwt = require("@nestjs/jwt");
const _wsCookieAuthguard = require("../common/guards/wsCookieAuth.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let WebsocketModule = class WebsocketModule {
};
WebsocketModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _messagesmodule.MessagesModule,
            _jwt.JwtModule.register({
                secret: process.env.JWT_SECRET
            })
        ],
        providers: [
            _websocketgateway.WebsocketGateway,
            _wsCookieAuthguard.WsCookieAuthGuard
        ],
        exports: [
            _websocketgateway.WebsocketGateway
        ]
    })
], WebsocketModule);

//# sourceMappingURL=websoket.module.js.map