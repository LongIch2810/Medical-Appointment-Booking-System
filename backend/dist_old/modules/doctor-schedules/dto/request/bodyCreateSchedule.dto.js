"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get BodyCreateScheduleDto () {
        return BodyCreateScheduleDto;
    },
    get IsStartTimeBeforeEndTimeConstraint () {
        return IsStartTimeBeforeEndTimeConstraint;
    }
});
const _classvalidator = require("class-validator");
const _dayOfWeek = require("../../../../shared/enums/dayOfWeek");
const _toMinutes = require("../../../../utils/toMinutes");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let IsStartTimeBeforeEndTimeConstraint = class IsStartTimeBeforeEndTimeConstraint {
    validate(start_time, args) {
        const end_time = args.object.end_time;
        if (!start_time || !end_time) return true;
        return (0, _toMinutes.toMinutes)(start_time) < (0, _toMinutes.toMinutes)(end_time);
    }
    defaultMessage(args) {
        return 'start_time must be earlier than end_time';
    }
};
IsStartTimeBeforeEndTimeConstraint = _ts_decorate([
    (0, _classvalidator.ValidatorConstraint)({
        name: 'isStartTimeBeforeEndTime',
        async: false
    })
], IsStartTimeBeforeEndTimeConstraint);
let BodyCreateScheduleDto = class BodyCreateScheduleDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", typeof _dayOfWeek.DayOfWeek === "undefined" ? Object : _dayOfWeek.DayOfWeek)
], BodyCreateScheduleDto.prototype, "day_of_week", void 0);
_ts_decorate([
    (0, _classvalidator.IsMilitaryTime)(),
    (0, _classvalidator.Validate)(IsStartTimeBeforeEndTimeConstraint),
    _ts_metadata("design:type", String)
], BodyCreateScheduleDto.prototype, "start_time", void 0);
_ts_decorate([
    (0, _classvalidator.IsMilitaryTime)(),
    _ts_metadata("design:type", String)
], BodyCreateScheduleDto.prototype, "end_time", void 0);

//# sourceMappingURL=bodyCreateSchedule.dto.js.map