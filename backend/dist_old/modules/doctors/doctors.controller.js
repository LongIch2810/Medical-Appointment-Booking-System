"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorsController", {
    enumerable: true,
    get: function() {
        return DoctorsController;
    }
});
const _common = require("@nestjs/common");
const _bodyFilterDoctorsdto = require("./dto/request/bodyFilterDoctors.dto");
const _doctorsservice = require("./doctors.service");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateDoctordto = require("./dto/request/bodyCreateDoctor.dto");
const _bodyUpdateDoctordto = require("./dto/request/bodyUpdateDoctor.dto");
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
let DoctorsController = class DoctorsController {
    async getFilterDoctors(bodyFilterDoctor) {
        const result = await this.doctorsService.filterAndPagination(bodyFilterDoctor);
        return result;
    }
    async createDoctor(body) {
        return this.doctorsService.create(body);
    }
    async getOutstandingDoctors() {
        console.log('Fetching outstanding doctors...');
        const outstandingDoctors = await this.doctorsService.getOutstandingDoctors();
        return outstandingDoctors;
    }
    async getDoctorDetail(doctorId) {
        const doctorDetail = await this.doctorsService.getDoctorDetail(doctorId);
        return doctorDetail;
    }
    async updateDoctor(doctorId, body) {
        return this.doctorsService.update(doctorId, body);
    }
    async deleteDoctor(doctorId) {
        return this.doctorsService.remove(doctorId);
    }
    constructor(doctorsService){
        this.doctorsService = doctorsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterDoctorsdto.BodyFilterDoctorsDto === "undefined" ? Object : _bodyFilterDoctorsdto.BodyFilterDoctorsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "getFilterDoctors", null);
_ts_decorate([
    (0, _common.Post)('create'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'doctors'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateDoctordto.BodyCreateDoctorDto === "undefined" ? Object : _bodyCreateDoctordto.BodyCreateDoctorDto
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "createDoctor", null);
_ts_decorate([
    (0, _common.Get)('outstanding-doctors'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "getOutstandingDoctors", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_READ),
    (0, _common.Get)(':doctorId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('doctorId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "getDoctorDetail", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_UPDATE),
    (0, _common.Patch)(':doctorId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'doctors'
    }),
    _ts_param(0, (0, _common.Param)('doctorId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateDoctordto.BodyUpdateDoctorDto === "undefined" ? Object : _bodyUpdateDoctordto.BodyUpdateDoctorDto
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "updateDoctor", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.DOCTOR_DELETE),
    (0, _common.Delete)(':doctorId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'doctors'
    }),
    _ts_param(0, (0, _common.Param)('doctorId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], DoctorsController.prototype, "deleteDoctor", null);
DoctorsController = _ts_decorate([
    (0, _common.Controller)('doctors'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _doctorsservice.DoctorsService === "undefined" ? Object : _doctorsservice.DoctorsService
    ])
], DoctorsController);

//# sourceMappingURL=doctors.controller.js.map