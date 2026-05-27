"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorSchedulesController", {
    enumerable: true,
    get: function() {
        return DoctorSchedulesController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _doctorschedulesservice = require("./doctor-schedules.service");
const _bodyCreateScheduledto = require("./dto/request/bodyCreateSchedule.dto");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
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
let DoctorSchedulesController = class DoctorSchedulesController {
    async getPersonalSchedules(req) {
        const { userId } = req.user;
        return this.doctorSchedulesService.getPersonalSchedules(userId);
    }
    async createSchedule(req, bodyCreateSchedule) {
        const { userId } = req.user;
        return this.doctorSchedulesService.create(userId, bodyCreateSchedule);
    }
    async getDoctorSchedules(doctorId) {
        return this.doctorSchedulesService.getSchedulesByDoctorId(doctorId);
    }
    async updateSchedule(req, doctorScheduleId, bodyUpdateSchedule) {
        const { userId } = req.user;
        return this.doctorSchedulesService.update(userId, doctorScheduleId, bodyUpdateSchedule);
    }
    async updateScheduleStatus(req, doctorScheduleId, isActive) {
        const { userId } = req.user;
        return this.doctorSchedulesService.updateActive(userId, doctorScheduleId, isActive);
    }
    async deleteSchedule(req, doctorScheduleId) {
        const { userId } = req.user;
        return this.doctorSchedulesService.remove(userId, doctorScheduleId);
    }
    constructor(doctorSchedulesService){
        this.doctorSchedulesService = doctorSchedulesService;
    }
};
_ts_decorate([
    (0, _common.Post)('personal-schedules'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "getPersonalSchedules", null);
_ts_decorate([
    (0, _common.Post)('create-schedule'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'doctor-schedules'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyCreateScheduledto.BodyCreateScheduleDto === "undefined" ? Object : _bodyCreateScheduledto.BodyCreateScheduleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "createSchedule", null);
_ts_decorate([
    (0, _common.Get)(':doctorId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_READ),
    _ts_param(0, (0, _common.Param)('doctorId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "getDoctorSchedules", null);
_ts_decorate([
    (0, _common.Patch)(':doctorScheduleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'doctor-schedules'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('doctorScheduleId', _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number,
        typeof _bodyCreateScheduledto.BodyCreateScheduleDto === "undefined" ? Object : _bodyCreateScheduledto.BodyCreateScheduleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "updateSchedule", null);
_ts_decorate([
    (0, _common.Patch)(':doctorScheduleId/status'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_UPDATE_STATUS),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'doctor-schedules.status'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('doctorScheduleId', _common.ParseIntPipe)),
    _ts_param(2, (0, _common.Body)('is_active', _common.ParseBoolPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number,
        Boolean
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "updateScheduleStatus", null);
_ts_decorate([
    (0, _common.Delete)(':doctorScheduleId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_SCHEDULE_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'doctor-schedules'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('doctorScheduleId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorSchedulesController.prototype, "deleteSchedule", null);
DoctorSchedulesController = _ts_decorate([
    (0, _common.Controller)('doctor-schedules'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _doctorschedulesservice.DoctorSchedulesService === "undefined" ? Object : _doctorschedulesservice.DoctorSchedulesService
    ])
], DoctorSchedulesController);

//# sourceMappingURL=doctor-schedules.controller.js.map