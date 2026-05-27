"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OtpsController", {
    enumerable: true,
    get: function() {
        return OtpsController;
    }
});
const _common = require("@nestjs/common");
const _otpsservice = require("./otps.service");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
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
let OtpsController = class OtpsController {
    async sendOtp(email) {
        const { message } = await this.otpsService.sendOtpToEmail(email);
        return message;
    }
    async verifyOtp(otpCode, email) {
        const { message } = await this.otpsService.verifyOtp(otpCode, email);
        return message;
    }
    constructor(otpsService){
        this.otpsService = otpsService;
    }
};
_ts_decorate([
    (0, _common.Post)('send-otp'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'otps.send'
    }),
    _ts_param(0, (0, _common.Body)('email')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], OtpsController.prototype, "sendOtp", null);
_ts_decorate([
    (0, _common.Post)('verify-otp'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGIN',
        entityName: 'otps.verify'
    }),
    _ts_param(0, (0, _common.Body)('otpCode')),
    _ts_param(1, (0, _common.Body)('email')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], OtpsController.prototype, "verifyOtp", null);
OtpsController = _ts_decorate([
    (0, _common.Controller)('otps'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _otpsservice.OtpsService === "undefined" ? Object : _otpsservice.OtpsService
    ])
], OtpsController);

//# sourceMappingURL=otps.controller.js.map