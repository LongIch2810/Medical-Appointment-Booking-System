"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OtpsService", {
    enumerable: true,
    get: function() {
        return OtpsService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _otpentity = /*#__PURE__*/ _interop_require_default(require("../../entities/otp.entity"));
const _typeorm1 = require("typeorm");
const _usersservice = require("../users/users.service");
const _generateOtpCode = require("../../utils/generateOtpCode");
const _emailproducer = require("../../bullmq/queues/email/email.producer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let OtpsService = class OtpsService {
    async deleteExpireOtps() {
        const now = new Date();
        const result = await this.otpRepo.delete({
            expiresAt: (0, _typeorm1.LessThan)(now)
        });
        console.log(`Deleted ${result.affected ?? 0} expired Otps`);
    }
    async sendOtpToEmail(email) {
        const userExists = await this.usersService.findByUsernameOrEmail(email);
        if (!userExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        let isOtpExits = true;
        let otpCode = '';
        while(isOtpExits){
            otpCode = (0, _generateOtpCode.generateOtpCode)();
            const otpExists = await this.otpRepo.findOne({
                where: [
                    {
                        otpCode
                    }
                ]
            });
            if (!otpExists) isOtpExits = false;
        }
        await this.emailProducer.sendOtp(email, otpCode, userExists.username);
        return {
            message: 'Đã gửi mã OTP đến gmail của bạn.'
        };
    }
    async verifyOtp(otpCode, email) {
        const user = await this.usersService.findByUsernameOrEmail(email);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        const otp = await this.otpRepo.findOne({
            where: {
                otpCode,
                user: user
            }
        });
        if (!otp) {
            throw new _common.NotFoundException('Mã OTP không hợp lệ!');
        }
        const now = new Date();
        if (otp.expiresAt < now) {
            throw new _common.NotFoundException('Mã OTP đã hết hạn!');
        }
        otp.verified = true;
        await this.otpRepo.save(otp);
        return {
            message: 'Xác thực mã OTP thành công.'
        };
    }
    constructor(otpRepo, usersService, emailProducer){
        this.otpRepo = otpRepo;
        this.usersService = usersService;
        this.emailProducer = emailProducer;
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_10_MINUTES),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], OtpsService.prototype, "deleteExpireOtps", null);
OtpsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_otpentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _emailproducer.EmailProducer === "undefined" ? Object : _emailproducer.EmailProducer
    ])
], OtpsService);

//# sourceMappingURL=otps.service.js.map