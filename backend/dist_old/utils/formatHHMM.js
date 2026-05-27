"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "formatHHMM", {
    enumerable: true,
    get: function() {
        return formatHHMM;
    }
});
const formatHHMM = (time)=>{
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
};

//# sourceMappingURL=formatHHMM.js.map