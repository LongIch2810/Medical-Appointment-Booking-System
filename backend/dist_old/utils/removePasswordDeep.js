"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "removePasswordDeep", {
    enumerable: true,
    get: function() {
        return removePasswordDeep;
    }
});
const _formatDate = require("./formatDate");
const removePasswordDeep = (obj)=>{
    if (obj instanceof Date) return (0, _formatDate.formatDateDDMMYYYY)(obj);
    if (Array.isArray(obj)) {
        return obj.map(removePasswordDeep);
    } else if (obj && typeof obj === 'object') {
        const { password, ...rest } = obj;
        for(const key in rest){
            if (rest[key] && typeof rest[key]) {
                rest[key] = removePasswordDeep(rest[key]);
            }
        }
        return rest;
    }
    return obj;
};

//# sourceMappingURL=removePasswordDeep.js.map