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
    get decrypt () {
        return decrypt;
    },
    get encrypt () {
        return encrypt;
    }
});
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
require("dotenv/config");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const algorithm = 'aes-256-cbc';
const secretKey = _crypto.createHash('sha256').update(process.env.SECRET_KEY || 'secretKey').digest();
const ivLength = 16;
const encrypt = (text)=>{
    const iv = _crypto.randomBytes(ivLength);
    const cipher = _crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);
    // 👉 Gắn IV + dữ liệu đã mã hóa lại thành chuỗi base64 để lưu
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};
const decrypt = (hash)=>{
    if (!hash || typeof hash !== 'string' || !hash.includes(':')) {
        return '';
    }
    const [ivHex, encryptedHex] = hash.split(':');
    if (!ivHex || !encryptedHex) {
        return '';
    }
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');
        const decipher = _crypto.createDecipheriv(algorithm, secretKey, iv);
        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    } catch  {
        return '';
    }
};

//# sourceMappingURL=encryption.js.map