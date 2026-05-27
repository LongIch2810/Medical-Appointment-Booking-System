"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentsController", {
    enumerable: true,
    get: function() {
        return AppointmentsController;
    }
});
const _common = require("@nestjs/common");
const _appointmentsservice = require("./appointments.service");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateAppointmentdto = require("./dto/request/bodyCreateAppointment.dto");
const _bodyPersonalAppointmentsdto = require("./dto/request/bodyPersonalAppointments.dto");
const _bodyFilterImprovedto = require("./dto/request/bodyFilterImprove.dto");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _bodyUpdateAppointmentStatusdto = require("./dto/request/bodyUpdateAppointmentStatus.dto");
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
let AppointmentsController = class AppointmentsController {
    async createAppointment(bodyCreateAppointment, req) {
        const { userId } = req.user;
        return this.appointmentsService.createWithNotifications(userId, bodyCreateAppointment);
    }
    async cancelAppointment(appointmentId, req) {
        const { userId } = req.user;
        const cancelAppointments = await this.appointmentsService.cancel(userId, appointmentId);
        return cancelAppointments;
    }
    async getPersonalAppointments(req, objectFilters) {
        const { userId } = req.user;
        const personalAppointments = await this.appointmentsService.findPersonalAppointments(userId, objectFilters);
        return personalAppointments;
    }
    async getAppointmentDetail(req, appointmentId) {
        const { userId } = req.user;
        const appointment = await this.appointmentsService.getAppointmentDetail(userId, appointmentId);
        return appointment;
    }
    async filterAndPaginationOfAdmin(req, objectFilters) {
        const adminAppointments = await this.appointmentsService.filterAndPaginationOfAdmin(objectFilters);
        return adminAppointments;
    }
    async findAndPaginationOfDoctor(req, objectFilters) {
        const { userId } = req.user;
        const doctorAppointments = await this.appointmentsService.findAndPaginationOfDoctor(userId, objectFilters);
        return doctorAppointments;
    }
    async updateAppointmentStatus(appointmentId, body) {
        return this.appointmentsService.updateStatus(appointmentId, body.status);
    }
    constructor(appointmentsService){
        this.appointmentsService = appointmentsService;
    }
};
_ts_decorate([
    (0, _common.Post)('booking'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'appointments'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateAppointmentdto.BodyCreateAppointmentDto === "undefined" ? Object : _bodyCreateAppointmentdto.BodyCreateAppointmentDto,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createAppointment", null);
_ts_decorate([
    (0, _common.Delete)('cancel/:id'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_CANCEL),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'appointments.cancel'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "cancelAppointment", null);
_ts_decorate([
    (0, _common.Post)('personal-appointments'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyPersonalAppointmentsdto.BodyPersonalAppointmentsDto === "undefined" ? Object : _bodyPersonalAppointmentsdto.BodyPersonalAppointmentsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPersonalAppointments", null);
_ts_decorate([
    (0, _common.Get)(':appointmentId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Param)('appointmentId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getAppointmentDetail", null);
_ts_decorate([
    (0, _common.Post)('admin/appointments'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_MANAGE),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyFilterImprovedto.BodyFilterImproveDto === "undefined" ? Object : _bodyFilterImprovedto.BodyFilterImproveDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "filterAndPaginationOfAdmin", null);
_ts_decorate([
    (0, _common.Post)('doctor/appointments'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_MANAGE),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyFilterImprovedto.BodyFilterImproveDto === "undefined" ? Object : _bodyFilterImprovedto.BodyFilterImproveDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findAndPaginationOfDoctor", null);
_ts_decorate([
    (0, _common.Patch)(':appointmentId/status'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.APPOINTMENT_UPDATE_STATUS),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'appointments.status'
    }),
    _ts_param(0, (0, _common.Param)('appointmentId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateAppointmentStatusdto.BodyUpdateAppointmentStatusDto === "undefined" ? Object : _bodyUpdateAppointmentStatusdto.BodyUpdateAppointmentStatusDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AppointmentsController.prototype, "updateAppointmentStatus", null);
AppointmentsController = _ts_decorate([
    (0, _common.Controller)('appointments'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _appointmentsservice.AppointmentsService === "undefined" ? Object : _appointmentsservice.AppointmentsService
    ])
], AppointmentsController);

//# sourceMappingURL=appointments.controller.js.map