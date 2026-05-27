"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isPgDriverError", {
    enumerable: true,
    get: function() {
        return isPgDriverError;
    }
});
function isPgDriverError(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const maybeError = value;
    return (maybeError.code === undefined || typeof maybeError.code === 'string') && (maybeError.constraint === undefined || typeof maybeError.constraint === 'string');
}

//# sourceMappingURL=isPgDriverError.js.map