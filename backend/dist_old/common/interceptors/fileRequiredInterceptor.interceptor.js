"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileRequiredInterceptor", {
    enumerable: true,
    get: function() {
        return FileRequiredInterceptor;
    }
});
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
let FileRequiredInterceptor = class FileRequiredInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const file = request.file;
        const files = request.files;
        console.log('>>> files : ', files);
        if (!file && (!files || files.length === 0)) {
            throw new _common.BadRequestException('No file provided!');
        }
        if (file) {
            this.validateFile(file);
        }
        if (files && Array.isArray(files)) {
            files.forEach((file)=>this.validateFile(file));
        }
        return next.handle();
    }
    validateFile(file) {
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new _common.BadRequestException(`File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
        if (file.size > this.maxFileSize) {
            throw new _common.BadRequestException(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
        }
    }
    constructor(allowedMimeTypes = [
        // images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // videos
        'video/mp4',
        'video/mpeg',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        // documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ], maxFileSize = 20 * 1024 * 1024){
        this.allowedMimeTypes = allowedMimeTypes;
        this.maxFileSize = maxFileSize;
    }
};
FileRequiredInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        Number
    ])
], FileRequiredInterceptor);

//# sourceMappingURL=fileRequiredInterceptor.interceptor.js.map