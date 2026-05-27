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
    get calculateFinalScore () {
        return calculateFinalScore;
    },
    get setIsOutstanding () {
        return setIsOutstanding;
    },
    get setIsOutstandingDoctor () {
        return setIsOutstandingDoctor;
    },
    get setIsOutstandingDoctors () {
        return setIsOutstandingDoctors;
    }
});
const _constants = require("./constants");
const setIsOutstanding = (doctor)=>{
    const finalScore = calculateFinalScore(doctor.avg_rating, doctor.appointments_completed);
    return finalScore >= _constants.thresholdOustanding;
};
const calculateFinalScore = (avg_rating, appointments_completed)=>{
    const finalScore = 0.7 * avg_rating + 0.3 * Math.log(1 + appointments_completed);
    return finalScore;
};
const setIsOutstandingDoctor = (doctor)=>{
    return {
        ...doctor,
        isOutstanding: setIsOutstanding(doctor)
    };
};
const setIsOutstandingDoctors = (doctors)=>{
    return doctors.map((doctor)=>({
            ...doctor,
            isOutstanding: setIsOutstanding(doctor)
        }));
};

//# sourceMappingURL=setIsOutstanding.js.map