"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyFilterSatisfactionRatingsDto", {
    enumerable: true,
    get: function() {
        return BodyFilterSatisfactionRatingsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _isBeforeOrEqualdecorator = require("../../../../common/decorators/isBeforeOrEqual.decorator");
const _paginationdto = require("../../../../common/dto/pagination.dto");
const _globaltype = require("../../../../shared/types/global.type");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyFilterSatisfactionRatingsDto = class BodyFilterSatisfactionRatingsDto extends _paginationdto.PaginationDto {
    constructor(...args){
        super(...args), this.arrange = 'desc';
    }
};
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    (0, _isBeforeOrEqualdecorator.IsBeforeOrEqual)('toDate', {
        message: 'fromDate must be before toDate'
    }),
    _ts_metadata("design:type", String)
], BodyFilterSatisfactionRatingsDto.prototype, "fromDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyFilterSatisfactionRatingsDto.prototype, "toDate", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyFilterSatisfactionRatingsDto.prototype, "doctorId", void 0);
_ts_decorate([
    (0, _classvalidator.IsIn)([
        'desc',
        'asc'
    ], {
        message: 'arrange phải là asc hoặc desc'
    }),
    _ts_metadata("design:type", typeof _globaltype.Arrange === "undefined" ? Object : _globaltype.Arrange)
], BodyFilterSatisfactionRatingsDto.prototype, "arrange", void 0);

//# sourceMappingURL=bodyFilterSatisfactionRatings.dto.js.map