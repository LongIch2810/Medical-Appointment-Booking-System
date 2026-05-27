"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GoogleStrategy", {
    enumerable: true,
    get: function() {
        return GoogleStrategy;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _passport = require("@nestjs/passport");
const _passportgoogleoauth20 = require("passport-google-oauth20");
const _usersservice = require("../users/users.service");
const _typeorm = require("typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _relationshipentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relationship.entity"));
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
const _healthProfileentity = /*#__PURE__*/ _interop_require_default(require("../../entities/healthProfile.entity"));
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
let GoogleStrategy = class GoogleStrategy extends (0, _passport.PassportStrategy)(_passportgoogleoauth20.Strategy, 'google') {
    async validate(accessToken, refreshToken, profile, done) {
        const { emails, photos } = profile;
        const email = emails[0].value;
        const user = await this.usersService.findByUsernameOrEmail(email);
        const picture = photos[0].value;
        if (user) {
            if (!user.picture) {
                await this.usersService.updateUserField(user.id, 'picture', picture);
            }
            return done(null, user);
        }
        const username = email.split('@')[0];
        const fullname = profile.displayName;
        try {
            return await this.dataSource.transaction(async (manager)=>{
                const newUser = manager.create(_userentity.default, {
                    username,
                    email,
                    fullname
                });
                await manager.save(_userentity.default, newUser);
                await manager.update(_userentity.default, newUser.id, {
                    picture
                });
                const relationship = await manager.findOne(_relationshipentity.default, {
                    where: {
                        relationship_code: 'ban-than'
                    }
                });
                if (!relationship) throw new _common.NotFoundException('Mối quan hệ mặc định không tồn tại.');
                const newRelative = manager.create(_relativeentity.default, {
                    user: newUser,
                    fullname,
                    relationship
                });
                await manager.save(_relativeentity.default, newRelative);
                const newHealth = manager.create(_healthProfileentity.default, {
                    patient: newRelative
                });
                await manager.save(_healthProfileentity.default, newHealth);
                done(null, newUser);
            });
        } catch (error) {
            console.error('Lỗi khi đăng ký:', error);
            throw error;
        }
    }
    constructor(configService, usersService, dataSource){
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get('GOOGLE_CALL_BACK'),
            scope: [
                'email',
                'profile'
            ]
        }), this.usersService = usersService, this.dataSource = dataSource;
    }
};
GoogleStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], GoogleStrategy);

//# sourceMappingURL=google.strategy.js.map