"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UploadsController", {
    enumerable: true,
    get: function() {
        return UploadsController;
    }
});
const _common = require("@nestjs/common");
const _fileRequiredInterceptorinterceptor = require("../common/interceptors/fileRequiredInterceptor.interceptor");
const _platformexpress = require("@nestjs/platform-express");
const _uploadFileproducer = require("../bullmq/queues/uploadFile/uploadFile.producer");
const _permissiondecorator = require("../common/decorators/permission.decorator");
const _jwtguard = require("../common/guards/jwt.guard");
const _permissionsguard = require("../common/guards/permissions.guard");
const _constants = require("../utils/constants");
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
let UploadsController = class UploadsController {
    async uploadFilesMessage(messageId, files) {
        console.log('>>> files', files);
        await this.uploadFileProducer.uploadFilesMessage({
            messageId,
            files
        });
        return {
            message: 'upload files message'
        };
    }
    async uploadFilesArticle(articleId, files) {
        console.log('>>> files', files);
        await this.uploadFileProducer.uploadFilesArticle({
            articleId,
            files
        });
        return {
            message: 'upload files article'
        };
    }
    constructor(uploadFileProducer){
        this.uploadFileProducer = uploadFileProducer;
    }
};
_ts_decorate([
    (0, _common.Post)('/messages/files'),
    (0, _common.HttpCode)(_common.HttpStatus.ACCEPTED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.MESSAGE_CREATE),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 4, {
        limits: {
            files: 4
        }
    }), new _fileRequiredInterceptorinterceptor.FileRequiredInterceptor()),
    _ts_param(0, (0, _common.Body)('message_id', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.UploadedFiles)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Array
    ]),
    _ts_metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadFilesMessage", null);
_ts_decorate([
    (0, _common.Post)('/articles/files'),
    (0, _common.HttpCode)(_common.HttpStatus.ACCEPTED),
    (0, _permissiondecorator.Permissions)(_constants.PERMISSIONS.ARTICLE_CREATE),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('files', 4, {
        limits: {
            files: 4
        }
    }), new _fileRequiredInterceptorinterceptor.FileRequiredInterceptor()),
    _ts_param(0, (0, _common.Body)('article_id', _common.ParseIntPipe)),
    _ts_param(1, (0, _common.UploadedFiles)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number,
        Array
    ]),
    _ts_metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadFilesArticle", null);
UploadsController = _ts_decorate([
    (0, _common.Controller)('uploads'),
    (0, _common.UseGuards)(_jwtguard.JwtAuthGuard, _permissionsguard.PermissionsGuard),
    _ts_param(0, (0, _common.Inject)((0, _common.forwardRef)(()=>_uploadFileproducer.UploadFileProducer))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _uploadFileproducer.UploadFileProducer === "undefined" ? Object : _uploadFileproducer.UploadFileProducer
    ])
], UploadsController);

//# sourceMappingURL=uploads.controller.js.map