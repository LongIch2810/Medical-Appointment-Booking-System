"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RemoveFieldPasswordInterceptor", {
    enumerable: true,
    get: function() {
        return RemoveFieldPasswordInterceptor;
    }
});
const _common = require("@nestjs/common");
const _operators = require("rxjs/operators");
const _removePasswordDeep = require("../../utils/removePasswordDeep");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RemoveFieldPasswordInterceptor = class RemoveFieldPasswordInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, _operators.map)((data)=>(0, _removePasswordDeep.removePasswordDeep)(data)));
    }
};
RemoveFieldPasswordInterceptor = _ts_decorate([
    (0, _common.Injectable)()
], RemoveFieldPasswordInterceptor);

//# sourceMappingURL=removeFieldPassword.interceptor.js.map