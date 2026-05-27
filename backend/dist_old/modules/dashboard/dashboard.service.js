"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardService", {
    enumerable: true,
    get: function() {
        return DashboardService;
    }
});
const _common = require("@nestjs/common");
const _healthprofileservice = require("../health-profile/health-profile.service");
const _usersservice = require("../users/users.service");
const _appointmentsservice = require("../appointments/appointments.service");
const _relativesservice = require("../relatives/relatives.service");
const _examinationresultservice = require("../examination-result/examination-result.service");
const _messagesservice = require("../messages/messages.service");
const _dashboardmapper = require("./dashboard.mapper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DashboardService = class DashboardService {
    async getPatientDashboard(userId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const healthProfilesCount = await this.healthProfileService.numberOfHealthProfilesByUserId(userId);
        const upcomingAppointmentsCount = await this.appointmentsService.numberOfUpcomingAppointmentsByUserId(userId);
        const relativesCount = await this.relativesService.numberOfRelativesByUserId(userId);
        const examinationResultsCount = await this.examinationResultService.numberOfExaminationResultsByUserId(userId);
        const personalHealthProfile = await this.healthProfileService.getPersonalHealthProfile(userId);
        return _dashboardmapper.DashboardMapper.toPatientDashboardResponse({
            healthProfilesCount,
            upcomingAppointmentsCount,
            relativesCount,
            examinationResultsCount,
            personalHealthProfile
        });
    }
    async getDoctorDashboard(userId, doctorId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const totalAppointmentsToDayCount = await this.appointmentsService.numberOfAppointmentsToDayActiveByDoctorId(doctorId);
        const upcomingAppointmentsCount = await this.appointmentsService.numberOfUpcomingAppointmentsByDoctorId(doctorId);
        const totalMessagesUnreadInAllChannelsCount = await this.messagesService.numberOfMessagesUnreadInAllChannel(userId);
        const appointmentToDayEarly = await this.appointmentsService.getAppoitnmentToDayEarlyOfDoctor(userId, doctorId);
        return _dashboardmapper.DashboardMapper.toDoctorDashboardResponse({
            totalAppointmentsToDayCount,
            upcomingAppointmentsCount,
            totalMessagesUnreadInAllChannelsCount,
            appointmentToDayEarly
        });
    }
    async getAdminDashboard(userId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const totalUsersCount = await this.usersService.numberOfUsersByAllRoles();
        const totalDoctorsActiveCount = await this.usersService.numberOfUsersByRoleDoctorActive();
        const totalPatientsActiveCount = await this.usersService.numberOfUsersByRolePatientActive();
        const totalAppointmentsToDayCount = await this.appointmentsService.numberOfAppointmentsToDayActive();
        const totalAppointmentsToDayCancelled = await this.appointmentsService.numberOfAppointmentsToDayCancelled();
        return _dashboardmapper.DashboardMapper.toAdminDashboardResponse({
            totalUsersCount,
            totalDoctorsActiveCount,
            totalPatientsActiveCount,
            totalAppointmentsToDayCount,
            totalAppointmentsToDayCancelled
        });
    }
    constructor(usersService, healthProfileService, appointmentsService, examinationResultService, messagesService, relativesService){
        this.usersService = usersService;
        this.healthProfileService = healthProfileService;
        this.appointmentsService = appointmentsService;
        this.examinationResultService = examinationResultService;
        this.messagesService = messagesService;
        this.relativesService = relativesService;
    }
};
DashboardService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _healthprofileservice.HealthProfileService === "undefined" ? Object : _healthprofileservice.HealthProfileService,
        typeof _appointmentsservice.AppointmentsService === "undefined" ? Object : _appointmentsservice.AppointmentsService,
        typeof _examinationresultservice.ExaminationResultService === "undefined" ? Object : _examinationresultservice.ExaminationResultService,
        typeof _messagesservice.MessagesService === "undefined" ? Object : _messagesservice.MessagesService,
        typeof _relativesservice.RelativesService === "undefined" ? Object : _relativesservice.RelativesService
    ])
], DashboardService);

//# sourceMappingURL=dashboard.service.js.map