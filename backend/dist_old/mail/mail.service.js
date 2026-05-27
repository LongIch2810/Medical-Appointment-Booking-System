"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MailService", {
    enumerable: true,
    get: function() {
        return MailService;
    }
});
const _mailer = require("@nestjs-modules/mailer");
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MailService = class MailService {
    async sendOtpEmail(to, otpCode, username) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Your OTP Code',
                template: 'otp',
                context: {
                    code: otpCode,
                    year: new Date().getFullYear(),
                    name: username
                }
            });
        } catch (error) {
            console.error('❌ Lỗi gửi mail:', error);
            throw error;
        }
    }
    async sendWelcomeEmail(to, username) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Your OTP Code',
                template: 'welcome',
                context: {
                    name: username,
                    year: new Date().getFullYear()
                }
            });
        } catch (error) {
            console.error('❌ Lỗi gửi mail:', error);
            throw error;
        }
    }
    constructor(mailerService){
        this.mailerService = mailerService;
    }
};
MailService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _mailer.MailerService === "undefined" ? Object : _mailer.MailerService
    ])
], MailService);

//# sourceMappingURL=mail.service.js.map