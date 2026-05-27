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
    get formatDate () {
        return formatDate;
    },
    get formatDateDDMMYYYY () {
        return formatDateDDMMYYYY;
    },
    get formatDateTimeDDMMYYYYHHmm () {
        return formatDateTimeDDMMYYYYHHmm;
    }
});
const formatDateDDMMYYYY = (date)=>{
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0'); // 5 -> "05"
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 9 -> "09"
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};
const formatDateTimeDDMMYYYYHHmm = (date)=>{
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}-${month}-${year}`;
};
const formatDate = (obj)=>{
    if (obj instanceof Date) {
        return formatDateDDMMYYYY(obj); // dd/MM/yyyy
    }
    if (Array.isArray(obj)) {
        return obj.map((item)=>formatDate(item));
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key of Object.keys(obj)){
            newObj[key] = formatDate(obj[key]);
        }
        return newObj;
    }
    return obj; // giữ nguyên nếu không phải Date/object/array
};

//# sourceMappingURL=formatDate.js.map