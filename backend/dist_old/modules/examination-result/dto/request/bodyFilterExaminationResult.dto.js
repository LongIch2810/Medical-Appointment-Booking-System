"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyFilterExaminationResultsDto", {
    enumerable: true,
    get: function() {
        return BodyFilterExaminationResultsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
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
let BodyFilterExaminationResultsDto = class BodyFilterExaminationResultsDto extends _paginationdto.PaginationDto {
    constructor(...args){
        super(...args), this.arrange = 'desc';
    }
};
_ts_decorate([
    (0, _classvalidator.IsDateString)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(({ value })=>value.trim()),
    _ts_metadata("design:type", String)
], BodyFilterExaminationResultsDto.prototype, "date", void 0);
_ts_decorate([
    (0, _classvalidator.IsIn)([
        'desc',
        'asc'
    ], {
        message: "'arrange pháº£i lÃ  asc hoáº·c desc'"
    }),
    _ts_metadata("design:type", typeof _globaltype.Arrange === "undefined" ? Object : _globaltype.Arrange)
], BodyFilterExaminationResultsDto.prototype, "arrange", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyFilterExaminationResultsDto.prototype, "relativeId", void 0);

//# sourceMappingURL=bodyFilterExaminationResult.dto.js.map