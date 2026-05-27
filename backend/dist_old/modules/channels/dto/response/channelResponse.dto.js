"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChannelResponseDto", {
    enumerable: true,
    get: function() {
        return ChannelResponseDto;
    }
});
const _classtransformer = require("class-transformer");
const _memberResonsedto = require("../../../users/dto/response/memberResonse.dto");
const _formatDate = require("../../../../utils/formatDate");
const _lastMessagedto = require("./lastMessage.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ChannelResponseDto = class ChannelResponseDto {
};
_ts_decorate([
    (0, _classtransformer.Expose)(),
    _ts_metadata("design:type", Number)
], ChannelResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ obj })=>obj.id),
    _ts_metadata("design:type", Number)
], ChannelResponseDto.prototype, "channel_id", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_lastMessagedto.LastMessageDto),
    _ts_metadata("design:type", Object)
], ChannelResponseDto.prototype, "last_message", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>Number(value ?? 0)),
    _ts_metadata("design:type", Number)
], ChannelResponseDto.prototype, "unread_count", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Type)(()=>_memberResonsedto.MemberResponseDto),
    _ts_metadata("design:type", Array)
], ChannelResponseDto.prototype, "participants", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], ChannelResponseDto.prototype, "created_at", void 0);
_ts_decorate([
    (0, _classtransformer.Expose)(),
    (0, _classtransformer.Transform)(({ value })=>(0, _formatDate.formatDateDDMMYYYY)(value)),
    _ts_metadata("design:type", String)
], ChannelResponseDto.prototype, "updated_at", void 0);
ChannelResponseDto = _ts_decorate([
    (0, _classtransformer.Exclude)()
], ChannelResponseDto);

//# sourceMappingURL=channelResponse.dto.js.map