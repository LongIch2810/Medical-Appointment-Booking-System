"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyUpdateUserDto", {
    enumerable: true,
    get: function() {
        return BodyUpdateUserDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyUpdateUserDto = class BodyUpdateUserDto {
};
_ts_decorate([
    (0, _classvalidator.IsPhoneNumber)('VN'),
    _ts_metadata("design:type", String)
], BodyUpdateUserDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyUpdateUserDto.prototype, "fullname", void 0);
_ts_decorate([
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], BodyUpdateUserDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Date),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], BodyUpdateUserDto.prototype, "date_of_birth", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyUpdateUserDto.prototype, "picture", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], BodyUpdateUserDto.prototype, "address", void 0);

//# sourceMappingURL=bodyUpdateUser.dto.js.map