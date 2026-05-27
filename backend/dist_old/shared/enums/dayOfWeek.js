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
    get DayOfWeek () {
        return DayOfWeek;
    },
    get dayNumberToEnum () {
        return dayNumberToEnum;
    }
});
var DayOfWeek = /*#__PURE__*/ function(DayOfWeek) {
    DayOfWeek["MONDAY"] = "Monday";
    DayOfWeek["TUESDAY"] = "Tuesday";
    DayOfWeek["WEDNESDAY"] = "Wednesday";
    DayOfWeek["THURSDAY"] = "Thursday";
    DayOfWeek["FRIDAY"] = "Friday";
    DayOfWeek["SATURDAY"] = "Saturday";
    DayOfWeek["SUNDAY"] = "Sunday";
    return DayOfWeek;
}({});
const dayNumberToEnum = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
};

//# sourceMappingURL=dayOfWeek.js.map