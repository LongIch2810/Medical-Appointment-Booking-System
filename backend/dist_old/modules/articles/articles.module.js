"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArticlesModule", {
    enumerable: true,
    get: function() {
        return ArticlesModule;
    }
});
const _common = require("@nestjs/common");
const _articlescontroller = require("./articles.controller");
const _articlesservice = require("./articles.service");
const _typeorm = require("@nestjs/typeorm");
const _articleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/article.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _bullmqmodule = require("../../bullmq/bullmq.module");
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
let ArticlesModule = class ArticlesModule {
};
ArticlesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _articleentity.default
            ]),
            _rediscachemodule.RedisCacheModule,
            (0, _common.forwardRef)(()=>_bullmqmodule.BullmqModule)
        ],
        controllers: [
            _articlescontroller.ArticlesController
        ],
        providers: [
            _articlesservice.ArticlesService
        ],
        exports: [
            _articlesservice.ArticlesService
        ]
    })
], ArticlesModule);

//# sourceMappingURL=articles.module.js.map