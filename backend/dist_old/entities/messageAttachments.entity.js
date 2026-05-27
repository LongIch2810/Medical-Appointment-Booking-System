"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return MessageAttachments;
    }
});
const _typeorm = require("typeorm");
const _messageentity = /*#__PURE__*/ _interop_require_default(require("./message.entity"));
const _FileType = require("../shared/enums/FileType");
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
let MessageAttachments = class MessageAttachments {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], MessageAttachments.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_messageentity.default, (m)=>m.message_attachments),
    (0, _typeorm.JoinColumn)({
        name: 'message_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], MessageAttachments.prototype, "message", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], MessageAttachments.prototype, "url", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        default: _FileType.FileType.IMAGE,
        enumName: 'file_type',
        enum: _FileType.FileType
    }),
    _ts_metadata("design:type", typeof _FileType.FileType === "undefined" ? Object : _FileType.FileType)
], MessageAttachments.prototype, "type", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], MessageAttachments.prototype, "file_name", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'int',
        nullable: false
    }),
    _ts_metadata("design:type", Number)
], MessageAttachments.prototype, "file_size", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false
    }),
    _ts_metadata("design:type", String)
], MessageAttachments.prototype, "file_extension", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: false,
        unique: true
    }),
    _ts_metadata("design:type", String)
], MessageAttachments.prototype, "public_id", void 0);
MessageAttachments = _ts_decorate([
    (0, _typeorm.Entity)('messages_attachments')
], MessageAttachments);

//# sourceMappingURL=messageAttachments.entity.js.map