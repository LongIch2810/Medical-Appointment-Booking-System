"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "generateSlug", {
    enumerable: true,
    get: function() {
        return generateSlug;
    }
});
const _slugify = /*#__PURE__*/ _interop_require_default(require("slugify"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const generateSlug = (title)=>{
    return (0, _slugify.default)(title, {
        lower: true,
        strict: true,
        trim: true,
        locale: 'vi',
        remove: /[*+~.()'"!:@]/g
    });
};

//# sourceMappingURL=generateSlug.js.map