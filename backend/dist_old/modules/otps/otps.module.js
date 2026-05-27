"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OtpsModule", {
    enumerable: true,
    get: function() {
        return OtpsModule;
    }
});
const _common = require("@nestjs/common");
const _otpsservice = require("./otps.service");
const _typeorm = require("@nestjs/typeorm");
const _otpscontroller = require("./otps.controller");
const _otpentity = /*#__PURE__*/ _interop_require_default(require("../../entities/otp.entity"));
const _usersmodule = require("../users/users.module");
const _bullmqmodule = require("../../bullmq/bullmq.module");
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
let OtpsModule = class OtpsModule {
};
OtpsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _otpentity.default
            ]),
            _usersmodule.UsersModule,
            _bullmqmodule.BullmqModule
        ],
        providers: [
            _otpsservice.OtpsService
        ],
        exports: [
            _otpsservice.OtpsService
        ],
        controllers: [
            _otpscontroller.OtpsController
        ]
    })
], OtpsModule);

//# sourceMappingURL=otps.module.js.map