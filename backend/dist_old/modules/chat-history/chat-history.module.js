"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChatHistoryModule", {
    enumerable: true,
    get: function() {
        return ChatHistoryModule;
    }
});
const _common = require("@nestjs/common");
const _chathistorycontroller = require("./chat-history.controller");
const _chathistoryservice = require("./chat-history.service");
const _usersmodule = require("../users/users.module");
const _typeorm = require("@nestjs/typeorm");
const _conversationentity = /*#__PURE__*/ _interop_require_default(require("../../entities/conversation.entity"));
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
let ChatHistoryModule = class ChatHistoryModule {
};
ChatHistoryModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule),
            _typeorm.TypeOrmModule.forFeature([
                _conversationentity.default
            ])
        ],
        controllers: [
            _chathistorycontroller.ChatHistoryController
        ],
        providers: [
            _chathistoryservice.ChatHistoryService
        ],
        exports: [
            _chathistoryservice.ChatHistoryService
        ]
    })
], ChatHistoryModule);

//# sourceMappingURL=chat-history.module.js.map