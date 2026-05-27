"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorSchedulesModule", {
    enumerable: true,
    get: function() {
        return DoctorSchedulesModule;
    }
});
const _common = require("@nestjs/common");
const _doctorschedulescontroller = require("./doctor-schedules.controller");
const _doctorschedulesservice = require("./doctor-schedules.service");
const _typeorm = require("@nestjs/typeorm");
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctorSchedule.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _doctorsmodule = require("../doctors/doctors.module");
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
let DoctorSchedulesModule = class DoctorSchedulesModule {
};
DoctorSchedulesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _doctorScheduleentity.default
            ]),
            _doctorsmodule.DoctorsModule,
            _rediscachemodule.RedisCacheModule
        ],
        controllers: [
            _doctorschedulescontroller.DoctorSchedulesController
        ],
        providers: [
            _doctorschedulesservice.DoctorSchedulesService
        ],
        exports: [
            _doctorschedulesservice.DoctorSchedulesService
        ]
    })
], DoctorSchedulesModule);

//# sourceMappingURL=doctor-schedules.module.js.map