"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Message;
    }
});
const _messageType = require("../shared/enums/messageType");
const _typeorm = require("typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("./user.entity"));
const _channelentity = /*#__PURE__*/ _interop_require_default(require("./channel.entity"));
const _messageAttachmentsentity = /*#__PURE__*/ _interop_require_default(require("./messageAttachments.entity"));
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
let Message = class Message {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], Message.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        nullable: false,
        enumName: 'message_type',
        enum: _messageType.MessageType
    }),
    _ts_metadata("design:type", typeof _messageType.MessageType === "undefined" ? Object : _messageType.MessageType)
], Message.prototype, "message_type", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], Message.prototype, "content", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: false
    }),
    _ts_metadata("design:type", Boolean)
], Message.prototype, "is_read", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_messageAttachmentsentity.default, (ma)=>ma.message),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Message.prototype, "message_attachments", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_userentity.default, (u)=>u.chat_messages, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'sender_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Message.prototype, "sender", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_channelentity.default, (c)=>c.chat_messages),
    (0, _typeorm.JoinColumn)({
        name: 'channel_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], Message.prototype, "channel", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Message.prototype, "created_at", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Message.prototype, "updated_at", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        name: 'deleted_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Message.prototype, "deleted_at", void 0);
Message = _ts_decorate([
    (0, _typeorm.Entity)('messages')
], Message);

//# sourceMappingURL=message.entity.js.map