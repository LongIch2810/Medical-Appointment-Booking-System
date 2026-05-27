"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelationshipsController", {
    enumerable: true,
    get: function() {
        return RelationshipsController;
    }
});
const _common = require("@nestjs/common");
const _relationshipsservice = require("./relationships.service");
const _bodyFilterRelationshipsdto = require("./dto/request/bodyFilterRelationships.dto");
const _bodyCreateRelationshipdto = require("./dto/request/bodyCreateRelationship.dto");
const _bodyUpdateRelationshipdto = require("./dto/request/bodyUpdateRelationship.dto");
const _jwtguard = require("../../common/guards/jwt.guard");
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
let RelationshipsController = class RelationshipsController {
    async getFilterRelationships(objectFilters) {
        const result = await this.relationshipsService.filterAndPagination(objectFilters);
        return result;
    }
    async createRelationship(body) {
        return this.relationshipsService.create(body);
    }
    async getRelationshipDetail(relationshipCode) {
        return this.relationshipsService.getRelationshipDetail(relationshipCode);
    }
    async updateRelationship(relationshipCode, body) {
        return this.relationshipsService.update(relationshipCode, body);
    }
    async deleteRelationship(relationshipCode) {
        return this.relationshipsService.remove(relationshipCode);
    }
    constructor(relationshipsService){
        this.relationshipsService = relationshipsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterRelationshipsdto.BodyFilterRelationshipsDto === "undefined" ? Object : _bodyFilterRelationshipsdto.BodyFilterRelationshipsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RelationshipsController.prototype, "getFilterRelationships", null);
_ts_decorate([
    (0, _common.Post)('create'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIONSHIP_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'relationships'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyCreateRelationshipdto.BodyCreateRelationshipDto === "undefined" ? Object : _bodyCreateRelationshipdto.BodyCreateRelationshipDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RelationshipsController.prototype, "createRelationship", null);
_ts_decorate([
    (0, _common.Get)(':relationshipCode'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('relationshipCode')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], RelationshipsController.prototype, "getRelationshipDetail", null);
_ts_decorate([
    (0, _common.Patch)(':relationshipCode'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIONSHIP_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'relationships'
    }),
    _ts_param(0, (0, _common.Param)('relationshipCode')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _bodyUpdateRelationshipdto.BodyUpdateRelationshipDto === "undefined" ? Object : _bodyUpdateRelationshipdto.BodyUpdateRelationshipDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RelationshipsController.prototype, "updateRelationship", null);
_ts_decorate([
    (0, _common.Delete)(':relationshipCode'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.RELATIONSHIP_DELETE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'DELETE',
        entityName: 'relationships'
    }),
    _ts_param(0, (0, _common.Param)('relationshipCode')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], RelationshipsController.prototype, "deleteRelationship", null);
RelationshipsController = _ts_decorate([
    (0, _common.Controller)('relationships'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _relationshipsservice.RelationshipsService === "undefined" ? Object : _relationshipsservice.RelationshipsService
    ])
], RelationshipsController);

//# sourceMappingURL=relationships.controller.js.map