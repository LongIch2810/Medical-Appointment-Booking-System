"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpExceptionFilter", {
    enumerable: true,
    get: function() {
        return HttpExceptionFilter;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (response.headersSent) {
            return;
        }
        let status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let details = 'Internal server error';
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                details = res;
            } else if (typeof res === 'object' && res !== null) {
                const obj = res;
                if (Array.isArray(obj.message) && status === 400) {
                    code = 'VALIDATION_FAILED';
                    details = obj.message;
                } else {
                    code = obj.code || _common.HttpStatus[status] || 'UNKNOWN_ERROR';
                    details = obj.message || obj.error || 'Bad request';
                }
            }
        }
        response.status(status).json({
            statusCode: status,
            success: false,
            data: null,
            error: {
                code,
                details
            }
        });
    }
};
HttpExceptionFilter = _ts_decorate([
    (0, _common.Catch)()
], HttpExceptionFilter);

//# sourceMappingURL=http-exception.filter.js.map