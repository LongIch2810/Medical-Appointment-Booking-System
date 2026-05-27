"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return ChannelMembers;
    }
});
const _typeorm = require("typeorm");
const _userentity = /*#__PURE__*/ _interop_require_default(require("./user.entity"));
const _channelentity = /*#__PURE__*/ _interop_require_default(require("./channel.entity"));
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
let ChannelMembers = class ChannelMembers {
};
_ts_decorate([
    (0, _typeorm.PrimaryGeneratedColumn)(),
    _ts_metadata("design:type", Number)
], ChannelMembers.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_userentity.default, (u)=>u.channels),
    (0, _typeorm.JoinColumn)({
        name: 'participant_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], ChannelMembers.prototype, "user", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_channelentity.default, (c)=>c.participants, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'channel_id'
    }),
    _ts_metadata("design:type", typeof _typeorm.Relation === "undefined" ? Object : _typeorm.Relation)
], ChannelMembers.prototype, "channel", void 0);
ChannelMembers = _ts_decorate([
    (0, _typeorm.Entity)('channel_members'),
    (0, _typeorm.Unique)('UQ_channel_members', [
        'channel',
        'user'
    ])
], ChannelMembers);

//# sourceMappingURL=channelMembers.entity.js.map