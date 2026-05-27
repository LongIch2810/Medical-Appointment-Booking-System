"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorsModule", {
    enumerable: true,
    get: function() {
        return DoctorsModule;
    }
});
const _common = require("@nestjs/common");
const _doctorscontroller = require("./doctors.controller");
const _doctorsservice = require("./doctors.service");
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctor.entity"));
const _typeorm = require("@nestjs/typeorm");
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _appointmententity = /*#__PURE__*/ _interop_require_default(require("../../entities/appointment.entity"));
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _specialtyentity = /*#__PURE__*/ _interop_require_default(require("../../entities/specialty.entity"));
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
let DoctorsModule = class DoctorsModule {
};
DoctorsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _doctorentity.default,
                _appointmententity.default,
                _userentity.default,
                _specialtyentity.default
            ]),
            _rediscachemodule.RedisCacheModule
        ],
        controllers: [
            _doctorscontroller.DoctorsController
        ],
        providers: [
            _doctorsservice.DoctorsService
        ],
        exports: [
            _doctorsservice.DoctorsService
        ]
    })
], DoctorsModule);

//# sourceMappingURL=doctors.module.js.map