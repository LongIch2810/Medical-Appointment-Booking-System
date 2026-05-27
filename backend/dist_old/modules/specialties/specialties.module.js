"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SpecialtiesModule", {
    enumerable: true,
    get: function() {
        return SpecialtiesModule;
    }
});
const _common = require("@nestjs/common");
const _specialtiescontroller = require("./specialties.controller");
const _specialtiesservice = require("./specialties.service");
const _typeorm = require("@nestjs/typeorm");
const _specialtyentity = /*#__PURE__*/ _interop_require_default(require("../../entities/specialty.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _cloudinarymodule = require("../../uploads/cloudinary.module");
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
let SpecialtiesModule = class SpecialtiesModule {
};
SpecialtiesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _specialtyentity.default
            ]),
            _rediscachemodule.RedisCacheModule,
            _cloudinarymodule.CloudinaryModule
        ],
        controllers: [
            _specialtiescontroller.SpecialtiesController
        ],
        providers: [
            _specialtiesservice.SpecialtiesService
        ],
        exports: [
            _specialtiesservice.SpecialtiesService
        ]
    })
], SpecialtiesModule);

//# sourceMappingURL=specialties.module.js.map