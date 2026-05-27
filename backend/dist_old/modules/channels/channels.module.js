"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChannelsModule", {
    enumerable: true,
    get: function() {
        return ChannelsModule;
    }
});
const _common = require("@nestjs/common");
const _channelscontroller = require("./channels.controller");
const _channelsservice = require("./channels.service");
const _typeorm = require("@nestjs/typeorm");
const _channelentity = /*#__PURE__*/ _interop_require_default(require("../../entities/channel.entity"));
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
let ChannelsModule = class ChannelsModule {
};
ChannelsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _channelentity.default
            ]),
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule)
        ],
        controllers: [
            _channelscontroller.ChannelsController
        ],
        providers: [
            _channelsservice.ChannelsService
        ],
        exports: [
            _channelsservice.ChannelsService
        ]
    })
], ChannelsModule);

//# sourceMappingURL=channels.module.js.map