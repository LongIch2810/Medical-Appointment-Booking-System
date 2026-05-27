"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MailModule", {
    enumerable: true,
    get: function() {
        return MailModule;
    }
});
const _common = require("@nestjs/common");
const _mailer = require("@nestjs-modules/mailer");
const _handlebarsadapter = require("@nestjs-modules/mailer/dist/adapters/handlebars.adapter");
const _mailservice = require("./mail.service");
const _config = require("@nestjs/config");
const _path = require("path");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let MailModule = class MailModule {
};
MailModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _mailer.MailerModule.forRootAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (configService)=>({
                        transport: {
                            host: 'smtp.gmail.com',
                            secure: false,
                            auth: {
                                user: configService.get('MAIL_USER'),
                                pass: configService.get('MAIL_PASS')
                            }
                        },
                        defaults: {
                            from: '"LifeHealth Hỗ trợ" <no-reply@lifehealth.vn>'
                        },
                        template: {
                            dir: (0, _path.join)(process.cwd(), 'dist/mail/templates'),
                            adapter: new _handlebarsadapter.HandlebarsAdapter(),
                            options: {
                                strict: true
                            }
                        }
                    })
            })
        ],
        providers: [
            _mailservice.MailService
        ],
        exports: [
            _mailservice.MailService
        ]
    })
], MailModule);

//# sourceMappingURL=mail.module.js.map