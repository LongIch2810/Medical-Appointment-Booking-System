"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersController", {
    enumerable: true,
    get: function() {
        return UsersController;
    }
});
const _common = require("@nestjs/common");
const _usersservice = require("./users.service");
const _jwtguard = require("../../common/guards/jwt.guard");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _bodyChangePassworddto = require("./dto/request/bodyChangePassword.dto");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
const _partialUpdateUserdto = require("./dto/request/partialUpdateUser.dto");
const _platformexpress = require("@nestjs/platform-express");
const _cloudinaryservice = require("../../uploads/cloudinary.service");
const _bodyFilterUsersdto = require("./dto/request/bodyFilterUsers.dto");
const _auditLogActiondecorator = require("../../common/decorators/auditLogAction.decorator");
const _bodyUpdateUserRolesdto = require("./dto/request/bodyUpdateUserRoles.dto");
const _permissiondecorator = require("../../common/decorators/permission.decorator");
const _permissionsguard = require("../../common/guards/permissions.guard");
const _constants = require("../../utils/constants");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
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
let UsersController = class UsersController {
    getUsers() {
        return this.userService.findAll();
    }
    async getUserInfo(req) {
        const { userId } = req.user;
        // const cachedUserInfo = await this.redisService.getData(`user:${userId}`);
        // if (cachedUserInfo) {
        //   return cachedUserInfo;
        // }
        const userInfo = await this.userService.getUserProfile(userId);
        if (!userInfo) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        // await this.redisService.setData(`user:${userId}`, userInfo, 60 * 60);
        return userInfo;
    }
    async updateUserInfo(req, bodyUpdateUser, file) {
        const { userId } = req.user;
        const user = await this.userService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        let uploadedResult = null;
        if (file) {
            uploadedResult = await this.cloudinaryService.uploadFile(file);
        }
        const fields = uploadedResult ? {
            ...bodyUpdateUser,
            picture: uploadedResult.secure_url
        } : bodyUpdateUser;
        await this.userService.updateUserFields(userId, fields);
        const updatedUser = await this.userService.findByUserId(userId);
        await this.redisService.delData(`user:${userId}`);
        return updatedUser;
    }
    async changePassword(req, bodyChangePassword) {
        const { userId } = req.user;
        const user = await this.userService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại!');
        }
        const { old_password, new_password } = bodyChangePassword;
        const isMatchPassword = await _bcryptjs.compare(old_password, user.password);
        if (!isMatchPassword) {
            throw new _common.BadRequestException('Mật khẩu cũ không trùng khớp.');
        }
        const hashedNewPassword = await _bcryptjs.hash(new_password, 10);
        await this.userService.updateUserField(userId, 'password', hashedNewPassword);
        return {
            message: 'Thay đổi mật khẩu thành công.'
        };
    }
    getUsersFilterAndPagination(objectFilters) {
        return this.userService.filterAndPagination(objectFilters);
    }
    getPatientsFilterAndPagination(objectFilters) {
        return this.userService.filterAndPaginationPatients(objectFilters);
    }
    getAdminUserDetail(userId) {
        return this.userService.getAdminUserDetail(userId);
    }
    lockUser(userId) {
        return this.userService.setLocking(userId, true);
    }
    unlockUser(userId) {
        return this.userService.setLocking(userId, false);
    }
    activateUser(userId) {
        return this.userService.setActive(userId, true);
    }
    deactivateUser(userId) {
        return this.userService.setActive(userId, false);
    }
    updateUserRoles(userId, body) {
        return this.userService.updateRoles(userId, body.role_ids);
    }
    constructor(userService, cloudinaryService, redisService){
        this.userService = userService;
        this.cloudinaryService = cloudinaryService;
        this.redisService = redisService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_READ),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "getUsers", null);
_ts_decorate([
    (0, _common.Get)('info'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_READ),
    _ts_param(0, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "getUserInfo", null);
_ts_decorate([
    (0, _common.Patch)('update-info'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.profile'
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('file', {
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter: (req, file, cb)=>{
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new _common.BadRequestException('Chỉ chấp nhận ảnh JPG/PNG/GIF/WEBP'), false);
            }
            cb(null, true);
        }
    })),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.UploadedFile)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _partialUpdateUserdto.PartialUpdateUserDto === "undefined" ? Object : _partialUpdateUserdto.PartialUpdateUserDto,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserInfo", null);
_ts_decorate([
    (0, _common.Put)('change-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_UPDATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.password'
    }),
    _ts_param(0, (0, _common.Request)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        typeof _bodyChangePassworddto.BodyChangePasswordDto === "undefined" ? Object : _bodyChangePassworddto.BodyChangePasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
_ts_decorate([
    (0, _common.Post)('users'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterUsersdto.BodyFilterUsersDto === "undefined" ? Object : _bodyFilterUsersdto.BodyFilterUsersDto
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "getUsersFilterAndPagination", null);
_ts_decorate([
    (0, _common.Post)('patients'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.PATIENT_READ),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _bodyFilterUsersdto.BodyFilterUsersDto === "undefined" ? Object : _bodyFilterUsersdto.BodyFilterUsersDto
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "getPatientsFilterAndPagination", null);
_ts_decorate([
    (0, _common.Get)(':userId'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_READ),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "getAdminUserDetail", null);
_ts_decorate([
    (0, _common.Patch)(':userId/lock'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_LOCK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.lock'
    }),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "lockUser", null);
_ts_decorate([
    (0, _common.Patch)(':userId/unlock'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_UNLOCK),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.unlock'
    }),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "unlockUser", null);
_ts_decorate([
    (0, _common.Patch)(':userId/activate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_ACTIVATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.activate'
    }),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "activateUser", null);
_ts_decorate([
    (0, _common.Patch)(':userId/deactivate'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_DEACTIVATE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.deactivate'
    }),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "deactivateUser", null);
_ts_decorate([
    (0, _common.Patch)(':userId/roles'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.USER_UPDATE_ROLE),
    (0, _auditLogActiondecorator.AuditLogAction)({
        action: 'UPDATE',
        entityName: 'users.roles'
    }),
    _ts_param(0, (0, _common.Param)('userId', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        typeof _bodyUpdateUserRolesdto.BodyUpdateUserRolesDto === "undefined" ? Object : _bodyUpdateUserRolesdto.BodyUpdateUserRolesDto
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserRoles", null);
UsersController = _ts_decorate([
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    (0, _common.Controller)('users'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _cloudinaryservice.CloudinaryService === "undefined" ? Object : _cloudinaryservice.CloudinaryService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], UsersController);

//# sourceMappingURL=users.controller.js.map