"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "generateOtpCode", {
    enumerable: true,
    get: function() {
        return generateOtpCode;
    }
});
const _crypto = require("crypto");
const generateOtpCode = ()=>{
    return (0, _crypto.randomInt)(100000, 1000000).toString();
};

//# sourceMappingURL=generateOtpCode.js.map