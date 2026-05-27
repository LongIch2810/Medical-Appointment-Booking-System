"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessagesModule", {
    enumerable: true,
    get: function() {
        return MessagesModule;
    }
});
const _common = require("@nestjs/common");
const _messagescontroller = require("./messages.controller");
const _messagesservice = require("./messages.service");
const _typeorm = require("@nestjs/typeorm");
const _messageentity = /*#__PURE__*/ _interop_require_default(require("../../entities/message.entity"));
const _channelentity = /*#__PURE__*/ _interop_require_default(require("../../entities/channel.entity"));
const _messageAttachmentsentity = /*#__PURE__*/ _interop_require_default(require("../../entities/messageAttachments.entity"));
const _channelsmodule = require("../channels/channels.module");
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
let MessagesModule = class MessagesModule {
};
MessagesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _messageentity.default,
                _channelentity.default,
                _messageAttachmentsentity.default
            ]),
            (0, _common.forwardRef)(()=>_channelsmodule.ChannelsModule),
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule)
        ],
        controllers: [
            _messagescontroller.MessagesController
        ],
        providers: [
            _messagesservice.MessagesService
        ],
        exports: [
            _messagesservice.MessagesService
        ]
    })
], MessagesModule);

//# sourceMappingURL=messages.module.js.map