"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "groupSchedulesByDay", {
    enumerable: true,
    get: function() {
        return groupSchedulesByDay;
    }
});
const _toMinutes = require("./toMinutes");
const groupSchedulesByDay = (schedules = [])=>{
    return schedules.reduce((acc, schedule)=>{
        if (!schedule?.start_time || !schedule?.end_time) {
            return acc;
        }
        const day = schedule.day_of_week;
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push({
            id: schedule.id,
            start_time: (0, _toMinutes.toHHMM)(schedule.start_time),
            end_time: (0, _toMinutes.toHHMM)(schedule.end_time),
            is_active: schedule.is_active
        });
        return acc;
    }, {});
};

//# sourceMappingURL=groupSchedulesByDay.js.map