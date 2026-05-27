"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelativeResponseDto", {
    enumerable: true,
    get: function() {
        return RelativeResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _relationshipResponsedto = require("../../../relationships/dto/response/relationshipResponse.dto");
const _userResponsedto = require("../../../users/dto/response/userResponse.dto");
const _formatDate = require("../../../../utils/formatDate");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RelativeResponseDto = class RelativeResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], RelativeResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], RelativeResponseDto.prototype, "fullname", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_relationshipResponsedto.RelationshipResponseDto),
    _ts_metadata("design:type", typeof _relationshipResponsedto.RelationshipResponseDto === "undefined" ? Object : _relationshipResponsedto.RelationshipResponseDto)
], RelativeResponseDto.prototype, "relationship", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], RelativeResponseDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RelativeResponseDto.prototype, "dob", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], RelativeResponseDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_userResponsedto.UserResponseDto),
    _ts_metadata("design:type", typeof _userResponsedto.UserResponseDto === "undefined" ? Object : _userResponsedto.UserResponseDto)
], RelativeResponseDto.prototype, "user", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], RelativeResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], RelativeResponseDto.prototype, "updated_at", void 0);
RelativeResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], RelativeResponseDto);

//# sourceMappingURL=relativeResponse.dto.js.map