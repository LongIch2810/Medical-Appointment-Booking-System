"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CloudinaryService", {
    enumerable: true,
    get: function() {
        return CloudinaryService;
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let CloudinaryService = class CloudinaryService {
    async uploadFile(file) {
        return new Promise((resolve, reject)=>{
            const stream = this.cdn.uploader.upload_stream({
                resource_type: 'auto',
                folder: 'uploads'
            }, (err, result)=>{
                if (err || !result) return reject(err || new Error('Upload failed'));
                resolve(result);
            });
            stream.end(file.buffer);
        });
    }
    async uploadMultipleFiles(files) {
        const normalizedFiles = files.map((file)=>{
            if (file.buffer && !(file.buffer instanceof Buffer)) {
                file.buffer = Buffer.from(file.buffer.data); // 👈 chuyển object → Buffer
            }
            return file;
        });
        const uploadPromises = normalizedFiles.map((file)=>this.uploadFile(file));
        return Promise.all(uploadPromises);
    }
    async deleteFile(publicId) {
        return this.cdn.uploader.destroy(publicId);
    }
    constructor(cdn){
        this.cdn = cdn;
    }
};
CloudinaryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)('CLOUDINARY')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ])
], CloudinaryService);

//# sourceMappingURL=cloudinary.service.js.map