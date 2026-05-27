"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExaminationResultModule", {
    enumerable: true,
    get: function() {
        return ExaminationResultModule;
    }
});
const _common = require("@nestjs/common");
const _examinationresultcontroller = require("./examination-result.controller");
const _examinationresultservice = require("./examination-result.service");
const _typeorm = require("@nestjs/typeorm");
const _examinationResultentity = /*#__PURE__*/ _interop_require_default(require("../../entities/examinationResult.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _appointmentsmodule = require("../appointments/appointments.module");
const _relativesmodule = require("../relatives/relatives.module");
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
let ExaminationResultModule = class ExaminationResultModule {
};
ExaminationResultModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _examinationResultentity.default
            ]),
            _rediscachemodule.RedisCacheModule,
            (0, _common.forwardRef)(()=>_appointmentsmodule.AppointmentsModule),
            _relativesmodule.RelativesModule,
            _usersmodule.UsersModule
        ],
        controllers: [
            _examinationresultcontroller.ExaminationResultController
        ],
        providers: [
            _examinationresultservice.ExaminationResultService
        ],
        exports: [
            _examinationresultservice.ExaminationResultService
        ]
    })
], ExaminationResultModule);

//# sourceMappingURL=examination-result.module.js.map