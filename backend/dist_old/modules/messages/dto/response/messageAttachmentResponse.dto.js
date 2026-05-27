"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessageAttachmentResponseDto", {
    enumerable: true,
    get: function() {
        return MessageAttachmentResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _FileType = require("../../../../shared/enums/FileType");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MessageAttachmentResponseDto = class MessageAttachmentResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], MessageAttachmentResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], MessageAttachmentResponseDto.prototype, "url", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _FileType.FileType === "undefined" ? Object : _FileType.FileType)
], MessageAttachmentResponseDto.prototype, "type", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], MessageAttachmentResponseDto.prototype, "file_name", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], MessageAttachmentResponseDto.prototype, "file_size", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], MessageAttachmentResponseDto.prototype, "file_extension", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], MessageAttachmentResponseDto.prototype, "public_id", void 0);
MessageAttachmentResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], MessageAttachmentResponseDto);

//# sourceMappingURL=messageAttachmentResponse.dto.js.map