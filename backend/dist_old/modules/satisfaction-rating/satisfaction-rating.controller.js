"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SatisfactionRatingController", {
    enumerable: true,
    get: function() {
        return SatisfactionRatingController;
    }
});
const _common = require("@nestjs/common");
const _jwtguard = require("../../common/guards/jwt.guard");
const _bodyCreateSatisfactionRatingdto = require("./dto/request/bodyCreateSatisfactionRating.dto");
const _bodyFilterSatisfactionRatingsdto = require("./dto/request/bodyFilterSatisfactionRatings.dto");
const _bodyUpdateSatisfactionRatingdto = require("./dto/request/bodyUpdateSatisfactionRating.dto");
const _satisfactionratingservice = require("./satisfaction-rating.service");
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
let SatisfactionRatingController = class SatisfactionRatingController {
    async getSatisfactionRatings(bodyFilterSatisfactionRatings) {
        return this.satisfactionRatingService.filterAndPagination(bodyFilterSatisfactionRatings);
    }
    async createSatisfactionRating(req, bodyCreateSatisfactionRating) {
        const { userId } = req.user;
        return this.satisfactionRatingService.create(userId, bodyCreateSatisfactionRating);
    }
    async getSatisfactionRatingDetail(ratingId) {
        return this.satisfactionRatingService.findById(ratingId);
    }
    async updateSatisfactionRating(ratingId, bodyUpdateSatisfactionRating) {
        return this.satisfactionRatingService.update(ratingId, bodyUpdateSatisfactionRating);
    }
    constructor(satisfactionRatingService){
        this.satisfactionRatingService = satisfactionRatingService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SATISFACTION_RATING_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterSatisfactionRatingsdto.BodyFilterSatisfactionRatingsDto === "undefined" ? Object : _bodyFilterSatisfactionRatingsdto.BodyFilterSatisfactionRatingsDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SatisfactionRatingController.prototype, "getSatisfactionRatings", null);
_ts_decorate([
    (0, _common.Post)('create-rating'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SATISFACTION_RATING_CREATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'satisfaction-rating'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyCreateSatisfactionRatingdto.BodyCreateSatisfactionRating === "undefined" ? Object : _bodyCreateSatisfactionRatingdto.BodyCreateSatisfactionRating
    ]),
    _ts_metadata("design:returntype", Promise)
], SatisfactionRatingController.prototype, "createSatisfactionRating", null);
_ts_decorate([
    (0, _common.Get)(':ratingId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SATISFACTION_RATING_READ),
    _ts_param(0, (0, _common.Param)('ratingId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], SatisfactionRatingController.prototype, "getSatisfactionRatingDetail", null);
_ts_decorate([
    (0, _common.Patch)(':ratingId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.SATISFACTION_RATING_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'satisfaction-rating'
    }),
    _ts_param(0, (0, _common.Param)('ratingId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateSatisfactionRatingdto.BodyUpdateSatisfactionRatingDto === "undefined" ? Object : _bodyUpdateSatisfactionRatingdto.BodyUpdateSatisfactionRatingDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SatisfactionRatingController.prototype, "updateSatisfactionRating", null);
SatisfactionRatingController = _ts_decorate([
    (0, _common.Controller)('satisfaction-rating'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _satisfactionratingservice.SatisfactionRatingService === "undefined" ? Object : _satisfactionratingservice.SatisfactionRatingService
    ])
], SatisfactionRatingController);

//# sourceMappingURL=satisfaction-rating.controller.js.map