"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TopicsModule", {
    enumerable: true,
    get: function() {
        return TopicsModule;
    }
});
const _common = require("@nestjs/common");
const _topicscontroller = require("./topics.controller");
const _topicsservice = require("./topics.service");
const _typeorm = require("@nestjs/typeorm");
const _topicentity = /*#__PURE__*/ _interop_require_default(require("../../entities/topic.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
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
let TopicsModule = class TopicsModule {
};
TopicsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _topicentity.default
            ]),
            _rediscachemodule.RedisCacheModule
        ],
        controllers: [
            _topicscontroller.TopicsController
        ],
        providers: [
            _topicsservice.TopicsService
        ],
        exports: [
            _topicsservice.TopicsService
        ]
    })
], TopicsModule);

//# sourceMappingURL=topics.module.js.map