"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelativesModule", {
    enumerable: true,
    get: function() {
        return RelativesModule;
    }
});
const _common = require("@nestjs/common");
const _relativescontroller = require("./relatives.controller");
const _relativesservice = require("./relatives.service");
const _typeorm = require("@nestjs/typeorm");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _usersmodule = require("../users/users.module");
const _relationshipsmodule = require("../relationships/relationships.module");
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
let RelativesModule = class RelativesModule {
};
RelativesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _relativeentity.default
            ]),
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule),
            _relationshipsmodule.RelationshipsModule
        ],
        controllers: [
            _relativescontroller.RelativesController
        ],
        providers: [
            _relativesservice.RelativesService
        ],
        exports: [
            _relativesservice.RelativesService
        ]
    })
], RelativesModule);

//# sourceMappingURL=relatives.module.js.map