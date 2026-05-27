"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MessageResponseDto", {
    enumerable: true,
    get: function() {
        return MessageResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _memberResonsedto = require("../../../users/dto/response/memberResonse.dto");
const _messageType = require("../../../../shared/enums/messageType");
const _formatDate = require("../../../../utils/formatDate");
const _messageAttachmentResponsedto = require("./messageAttachmentResponse.dto");
const _channelResponsedto = require("../../../channels/dto/response/channelResponse.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MessageResponseDto = class MessageResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], MessageResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", typeof _messageType.MessageType === "undefined" ? Object : _messageType.MessageType)
], MessageResponseDto.prototype, "message_type", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", String)
], MessageResponseDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Boolean)
], MessageResponseDto.prototype, "is_read", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_messageAttachmentResponsedto.MessageAttachmentResponseDto),
    _ts_metadata("design:type", Array)
], MessageResponseDto.prototype, "message_attachments", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_memberResonsedto.MemberResponseDto),
    _ts_metadata("design:type", typeof _memberResonsedto.MemberResponseDto === "undefined" ? Object : _memberResonsedto.MemberResponseDto)
], MessageResponseDto.prototype, "sender", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_channelResponsedto.ChannelResponseDto),
    _ts_metadata("design:type", typeof _channelResponsedto.ChannelResponseDto === "undefined" ? Object : _channelResponsedto.ChannelResponseDto)
], MessageResponseDto.prototype, "channel", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], MessageResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], MessageResponseDto.prototype, "updated_at", void 0);
MessageResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], MessageResponseDto);

//# sourceMappingURL=messageResponse.dto.js.map