"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentsModule", {
    enumerable: true,
    get: function() {
        return AppointmentsModule;
    }
});
const _common = require("@nestjs/common");
const _appointmentscontroller = require("./appointments.controller");
const _appointmentsservice = require("./appointments.service");
const _typeorm = require("@nestjs/typeorm");
const _appointmententity = /*#__PURE__*/ _interop_require_default(require("../../entities/appointment.entity"));
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctor.entity"));
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctorSchedule.entity"));
const _rediscachemodule = require("../../redis-cache/redis-cache.module");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _websoketmodule = require("../../websockets/websoket.module");
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _usersmodule = require("../users/users.module");
const _doctorschedulesmodule = require("../doctor-schedules/doctor-schedules.module");
const _relativesmodule = require("../relatives/relatives.module");
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
let AppointmentsModule = class AppointmentsModule {
};
AppointmentsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _appointmententity.default,
                _relativeentity.default,
                _doctorentity.default,
                _doctorScheduleentity.default,
                _userentity.default
            ]),
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule),
            _rediscachemodule.RedisCacheModule,
            _websoketmodule.WebsocketModule,
            _doctorschedulesmodule.DoctorSchedulesModule,
            _relativesmodule.RelativesModule
        ],
        controllers: [
            _appointmentscontroller.AppointmentsController
        ],
        providers: [
            _appointmentsservice.AppointmentsService
        ],
        exports: [
            _appointmentsservice.AppointmentsService
        ]
    })
], AppointmentsModule);

//# sourceMappingURL=appointments.module.js.map