"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _localAuthguard = require("../../common/guards/localAuth.guard");
const _authservice = require("./auth.service");
const _bodyRegisterdto = require("./dto/request/bodyRegister.dto");
const _jwtRefreshguard = require("../../common/guards/jwtRefresh.guard");
const _googleguard = require("../../common/guards/google.guard");
const _config = require("@nestjs/config");
const _jwtguard = require("../../common/guards/jwt.guard");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
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
let AuthController = class AuthController {
    async register(registerData) {
        const newUser = await this.authService.register(registerData);
        return newUser;
    }
    async login(req, res) {
        const { accessToken, refreshToken } = await this.authService.login(req);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.ACCESS_TOKEN_EXPIRE_TIME
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.REFRESH_TOKEN_EXPIRE_TIME
        });
        return res.status(_common.HttpStatus.OK).json({
            statusCode: 200,
            success: true,
            data: {
                accessToken,
                refreshToken
            },
            error: null
        });
    }
    async loginAdministrator(req, res) {
        const { accessToken, refreshToken } = await this.authService.loginAdministrator(req);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.ACCESS_TOKEN_EXPIRE_TIME
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.REFRESH_TOKEN_EXPIRE_TIME
        });
        return res.status(_common.HttpStatus.OK).json({
            statusCode: 200,
            success: true,
            data: {
                accessToken,
                refreshToken
            },
            error: null
        });
    }
    async refresh(req, res) {
        const payload = req.user;
        const { newAccessToken, newRefreshToken } = await this.authService.refresh(req, payload);
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.ACCESS_TOKEN_EXPIRE_TIME
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.REFRESH_TOKEN_EXPIRE_TIME
        });
        return res.status(_common.HttpStatus.OK).json({
            statusCode: 200,
            success: true,
            data: {
                message: 'Làm mới token thành công !'
            },
            error: null
        });
    }
    async logout(req, res) {
        const { message } = await this.authService.logout(req);
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(_common.HttpStatus.OK).json({
            statusCode: 200,
            success: true,
            data: {
                message
            },
            error: null
        });
    }
    async logoutAll(req) {
        const { message } = await this.authService.logoutAll(req);
        return {
            message
        };
    }
    async googleAuth() {}
    async googleAuthRedirect(req, res) {
        const { accessToken, refreshToken } = await this.authService.login(req);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.ACCESS_TOKEN_EXPIRE_TIME
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: _constants.REFRESH_TOKEN_EXPIRE_TIME
        });
        return res.redirect(this.configService.get('FRONTEND_URL') || 'http://localhost:5173');
    }
    async setNewPassword(email, newPassword) {
        const { message } = await this.authService.setNewPassword(email, newPassword);
        return message;
    }
    constructor(authService, configService){
        this.authService = authService;
        this.configService = configService;
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'CREATE',
        entityName: 'auth.register'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyRegisterdto.BodyRegisterDto === "undefined" ? Object : _bodyRegisterdto.BodyRegisterDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_localAuthguard.LocalAuthGuard),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGIN',
        entityName: 'auth.login'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('/admin/login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _common.UseGuards)(_localAuthguard.LocalAuthGuard),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGIN',
        entityName: 'auth.login-administrator'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "loginAdministrator", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtRefreshguard.JwtRefreshAuthGuard),
    (0, _common.Post)('refresh'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGIN',
        entityName: 'auth.refresh'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.AUTH_LOGOUT),
    (0, _common.Post)('logout'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGOUT',
        entityName: 'auth.logout'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.AUTH_LOGOUT),
    (0, _common.Post)('logout-all'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGOUT',
        entityName: 'auth.logout-all'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
_ts_decorate([
    (0, _common.Get)('google'),
    (0, _common.UseGuards)(_googleguard.GoogleAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
_ts_decorate([
    (0, _common.Get)('google/redirect'),
    (0, _common.UseGuards)(_googleguard.GoogleAuthGuard),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'LOGIN',
        entityName: 'auth.google'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Response)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
_ts_decorate([
    (0, _common.Post)('set-new-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'auth.password'
    }),
    _ts_param(0, (0, _common.Body)('email')),
    _ts_param(1, (0, _common.Body)('newPassword')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "setNewPassword", null);
AuthController = _ts_decorate([
    (0, _common.Controller)('auth'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map