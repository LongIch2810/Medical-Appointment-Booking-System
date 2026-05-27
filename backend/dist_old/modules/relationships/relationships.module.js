"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelationshipsModule", {
    enumerable: true,
    get: function() {
        return RelationshipsModule;
    }
});
const _common = require("@nestjs/common");
const _relationshipscontroller = require("./relationships.controller");
const _relationshipsservice = require("./relationships.service");
const _typeorm = require("@nestjs/typeorm");
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
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
let RelationshipsModule = class RelationshipsModule {
};
RelationshipsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _relationshipentity.default
            ])
        ],
        controllers: [
            _relationshipscontroller.RelationshipsController
        ],
        providers: [
            _relationshipsservice.RelationshipsService
        ],
        exports: [
            _relationshipsservice.RelationshipsService
        ]
    })
], RelationshipsModule);

//# sourceMappingURL=relationships.module.js.map