"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SpecialtiesController", {
    enumerable: true,
    get: function() {
        return SpecialtiesController;
    }
});
const _common = require("@nestjs/common");
const _specialtiesservice = require("./specialties.service");
const _cloudinaryservice = require("../../uploads/cloudinary.service");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateSpecialtydto = require("./dto/request/bodyCreateSpecialty.dto");
const _fileRequiredInterceptorinterceptor = require("../../common/interceptors/fileRequiredInterceptor.interceptor");
const _bodyFilterSpecialtiesdto = require("./dto/request/bodyFilterSpecialties.dto");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _bodyUpdateSpecialtydto = require("./dto/request/bodyUpdateSpecialty.dto");
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
let SpecialtiesController = class SpecialtiesController {
    async createSpecialty(bodyCreateSpecialty, file) {
        const uploadedResult = await this.cloudinaryService.uploadFile(file);
        const createdSpecialty = await this.specialtiesService.create({
            ...bodyCreateSpecialty,
            img_url: uploadedResult.secure_url
        });
        return createdSpecialty;
    }
    async updateSpecialty(specialtyId, bodyUpdateSpecialty) {
        return this.specialtiesService.update(specialtyId, bodyUpdateSpecialty);
    }
    async deleteSpecialty(specialtyId) {
        const deletedSpecialty = await this.specialtiesService.delete(specialtyId);
        return deletedSpecialty;
    }
    async getSpecialty(specialtyId) {
        const specialtyDetail = await this.specialtiesService.getSpecialtyDetail(specialtyId);
        return specialtyDetail;
    }
    async getSpecialties(bodyFilterSpecialties) {
        const result = await this.specialtiesService.filterAndPagination(bodyFilterSpecialties);
        return result;
    }
    constructor(specialtiesService, cloudinaryService){
        this.specialtiesService = specialtiesService;
        this.cloudinaryService = cloudinaryService;
    }
};
_ts_decorate([
    (0, _common.Post)('create-specialty'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SPECIALTY_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'specialties'
    }),
    (0, _common.UseInterceptors)(new _fileRequiredInterceptorinterceptor.FileRequiredInterceptor()),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateSpecialtydto.BodyCreateSpecialtyDto === "undefined" ? Object : _bodyCreateSpecialtydto.BodyCreateSpecialtyDto,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
    ]),
    _ts_metadata("design:returntype", Promise)
], SpecialtiesController.prototype, "createSpecialty", null);
_ts_decorate([
    (0, _common.Patch)(':specialtyId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SPECIALTY_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'specialties'
    }),
    _ts_param(0, (0, _common.Param)('specialtyId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateSpecialtydto.BodyUpdateSpecialtyDto === "undefined" ? Object : _bodyUpdateSpecialtydto.BodyUpdateSpecialtyDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SpecialtiesController.prototype, "updateSpecialty", null);
_ts_decorate([
    (0, _common.Delete)(':specialtyId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SPECIALTY_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'specialties'
    }),
    _ts_param(0, (0, _common.Param)('specialtyId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], SpecialtiesController.prototype, "deleteSpecialty", null);
_ts_decorate([
    (0, _common.Get)(':specialtyId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SPECIALTY_READ),
    _ts_param(0, (0, _common.Param)('specialtyId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], SpecialtiesController.prototype, "getSpecialty", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterSpecialtiesdto.BodyFilterSpecialtiesDto === "undefined" ? Object : _bodyFilterSpecialtiesdto.BodyFilterSpecialtiesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SpecialtiesController.prototype, "getSpecialties", null);
SpecialtiesController = _ts_decorate([
    (0, _common.Controller)('specialties'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _specialtiesservice.SpecialtiesService === "undefined" ? Object : _specialtiesservice.SpecialtiesService,
        typeof _cloudinaryservice.CloudinaryService === "undefined" ? Object : _cloudinaryservice.CloudinaryService
    ])
], SpecialtiesController);

//# sourceMappingURL=specialties.controller.js.map