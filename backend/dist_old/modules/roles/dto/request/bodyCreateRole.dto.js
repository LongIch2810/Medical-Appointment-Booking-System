"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyCreateRoleDto", {
    enumerable: true,
    get: function() {
        return BodyCreateRoleDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyCreateRoleDto = class BodyCreateRoleDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.Matches)(/^\S+$/),
    (0, _classvalidator.Matches)(/^[a-zA-Z][a-zA-Z_]+$/),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(3),
    _ts_metadata("design:type", String)
], BodyCreateRoleDto.prototype, "role_name", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : Number(value)),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", Number)
], BodyCreateRoleDto.prototype, "role_code", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(20),
    _ts_metadata("design:type", String)
], BodyCreateRoleDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsNumber)({}, {
        each: true
    }),
    _ts_metadata("design:type", Array)
], BodyCreateRoleDto.prototype, "permission_ids", void 0);

//# sourceMappingURL=bodyCreateRole.dto.js.map