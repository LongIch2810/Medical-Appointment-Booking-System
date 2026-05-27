"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardController", {
    enumerable: true,
    get: function() {
        return DashboardController;
    }
});
const _common = require("@nestjs/common");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _jwtguard = require("../../common/guards/jwt.guard");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
const _dashboardservice = require("./dashboard.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let DashboardController = class DashboardController {
    async getPatientDashboard(req) {
        const { userId } = req.user;
        return this.dashboardService.getPatientDashboard(userId);
    }
    async getDoctorDashboard(req) {
        const { userId } = req.user;
        const doctorId = req.user?.doctorId ?? req.user?.doctor?.id;
        return this.dashboardService.getDoctorDashboard(userId, doctorId);
    }
    async getAdminDashboard(req) {
        const { userId } = req.user;
        return this.dashboardService.getAdminDashboard(userId);
    }
    constructor(dashboardService){
        this.dashboardService = dashboardService;
    }
};
_ts_decorate([
    (0, _common.Get)('/patient'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DASHBOARD_PATIENT),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], DashboardController.prototype, "getPatientDashboard", null);
_ts_decorate([
    (0, _common.Get)('/doctor'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DASHBOARD_DOCTOR),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], DashboardController.prototype, "getDoctorDashboard", null);
_ts_decorate([
    (0, _common.Get)('/admin'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DASHBOARD_ADMIN),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], DashboardController.prototype, "getAdminDashboard", null);
DashboardController = _ts_decorate([
    (0, _common.Controller)('dashboard'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dashboardservice.DashboardService === "undefined" ? Object : _dashboardservice.DashboardService
    ])
], DashboardController);

//# sourceMappingURL=dashboard.controller.js.map