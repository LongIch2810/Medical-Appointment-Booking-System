"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorScheduleMapper", {
    enumerable: true,
    get: function() {
        return DoctorScheduleMapper;
    }
});
const _doctorScheduleResponsedto = require("./dto/response/doctorScheduleResponse.dto");
const _classtransformer = require("class-transformer");
const _groupSchedulesByDay = require("../../utils/groupSchedulesByDay");
let DoctorScheduleMapper = class DoctorScheduleMapper {
    static toDoctorScheduleResponseDto(doctorSchedule) {
        return (0, _classtransformer.plainToInstance)(_doctorScheduleResponsedto.DoctorScheduleResponseDto, doctorSchedule, {
            excludeExtraneousValues: true
        });
    }
    static toDoctorScheduleResponseDtoList(doctorSchedules) {
        return (0, _groupSchedulesByDay.groupSchedulesByDay)(doctorSchedules);
    }
};

//# sourceMappingURL=doctor-schedules.mapper.js.map