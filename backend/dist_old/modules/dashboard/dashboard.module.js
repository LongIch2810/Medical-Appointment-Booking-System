"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardModule", {
    enumerable: true,
    get: function() {
        return DashboardModule;
    }
});
const _common = require("@nestjs/common");
const _dashboardcontroller = require("./dashboard.controller");
const _dashboardservice = require("./dashboard.service");
const _usersmodule = require("../users/users.module");
const _healthprofilemodule = require("../health-profile/health-profile.module");
const _appointmentsmodule = require("../appointments/appointments.module");
const _relativesmodule = require("../relatives/relatives.module");
const _examinationresultmodule = require("../examination-result/examination-result.module");
const _messagesmodule = require("../messages/messages.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let DashboardModule = class DashboardModule {
};
DashboardModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _usersmodule.UsersModule,
            _healthprofilemodule.HealthProfileModule,
            _appointmentsmodule.AppointmentsModule,
            _examinationresultmodule.ExaminationResultModule,
            _relativesmodule.RelativesModule,
            _messagesmodule.MessagesModule
        ],
        controllers: [
            _dashboardcontroller.DashboardController
        ],
        providers: [
            _dashboardservice.DashboardService
        ]
    })
], DashboardModule);

//# sourceMappingURL=dashboard.module.js.map