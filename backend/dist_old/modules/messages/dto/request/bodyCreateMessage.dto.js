"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyCreateMessageDto", {
    enumerable: true,
    get: function() {
        return BodyCreateMessageDto;
    }
});
const _classvalidator = require("class-validator");
const _messageType = require("../../../../shared/enums/messageType");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BodyCreateMessageDto = class BodyCreateMessageDto {
};
_ts_decorate([
    (0, _classvalidator.IsEnum)(_messageType.MessageType),
    _ts_metadata("design:type", typeof _messageType.MessageType === "undefined" ? Object : _messageType.MessageType)
], BodyCreateMessageDto.prototype, "message_type", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], BodyCreateMessageDto.prototype, "content", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Number)
], BodyCreateMessageDto.prototype, "call_duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], BodyCreateMessageDto.prototype, "sender_id", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], BodyCreateMessageDto.prototype, "channel_id", void 0);

//# sourceMappingURL=bodyCreateMessage.dto.js.map