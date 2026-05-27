"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExaminationResultController", {
    enumerable: true,
    get: function() {
        return ExaminationResultController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateExaminationResultdto = require("./dto/request/bodyCreateExaminationResult.dto");
const _bodyFilterExaminationResultdto = require("./dto/request/bodyFilterExaminationResult.dto");
const _bodyUpdateExaminationResultdto = require("./dto/request/bodyUpdateExaminationResult.dto");
const _examinationresultservice = require("./examination-result.service");
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
let ExaminationResultController = class ExaminationResultController {
    async getExaminationResults(bodyFilterExaminationResults) {
        return this.examinationResultService.filterAndPagination(bodyFilterExaminationResults);
    }
    async createExaminationResult(req, bodyCreateExaminationResult) {
        const { userId } = req.user;
        return this.examinationResultService.create(userId, bodyCreateExaminationResult);
    }
    async getPersonalExaminationResults(req, bodyFilterExaminationResults) {
        const { userId } = req.user;
        return this.examinationResultService.findExaminationResultsByUserId(userId, bodyFilterExaminationResults);
    }
    async getExaminationResultDetail(resultId) {
        return this.examinationResultService.getExaminationResultDetail(resultId);
    }
    async updateExaminationResult(resultId, bodyUpdateExaminationResult) {
        return this.examinationResultService.update(resultId, bodyUpdateExaminationResult);
    }
    async deleteExaminationResult(resultId) {
        return this.examinationResultService.remove(resultId);
    }
    constructor(examinationResultService){
        this.examinationResultService = examinationResultService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterExaminationResultdto.BodyFilterExaminationResultsDto === "undefined" ? Object : _bodyFilterExaminationResultdto.BodyFilterExaminationResultsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "getExaminationResults", null);
_ts_decorate([
    (0, _common.Post)('create'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'examination-result'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyCreateExaminationResultdto.BodyCreateExaminationResultDto === "undefined" ? Object : _bodyCreateExaminationResultdto.BodyCreateExaminationResultDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "createExaminationResult", null);
_ts_decorate([
    (0, _common.Post)('personal/list'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyFilterExaminationResultdto.BodyFilterExaminationResultsDto === "undefined" ? Object : _bodyFilterExaminationResultdto.BodyFilterExaminationResultsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "getPersonalExaminationResults", null);
_ts_decorate([
    (0, _common.Get)(':resultId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_READ),
    _ts_param(0, (0, _common.Param)('resultId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "getExaminationResultDetail", null);
_ts_decorate([
    (0, _common.Patch)(':resultId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'examination-result'
    }),
    _ts_param(0, (0, _common.Param)('resultId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateExaminationResultdto.BodyUpdateExaminationResultDto === "undefined" ? Object : _bodyUpdateExaminationResultdto.BodyUpdateExaminationResultDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "updateExaminationResult", null);
_ts_decorate([
    (0, _common.Delete)(':resultId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.EXAMINATION_RESULT_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'examination-result'
    }),
    _ts_param(0, (0, _common.Param)('resultId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], ExaminationResultController.prototype, "deleteExaminationResult", null);
ExaminationResultController = _ts_decorate([
    (0, _common.Controller)('examination-result'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _examinationresultservice.ExaminationResultService === "undefined" ? Object : _examinationresultservice.ExaminationResultService
    ])
], ExaminationResultController);

//# sourceMappingURL=examination-result.controller.js.map