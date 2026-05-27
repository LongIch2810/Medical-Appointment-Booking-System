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
    get toHHMM () {
        return toHHMM;
    },
    get toMinutes () {
        return toMinutes;
    }
});
const toMinutes = (time)=>{
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};
const toHHMM = (time)=>{
    if (time instanceof Date) {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    return time.slice(0, 5);
};

//# sourceMappingURL=toMinutes.js.map