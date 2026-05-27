"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLogsModule", {
    enumerable: true,
    get: function() {
        return AuditLogsModule;
    }
});
const _common = require("@nestjs/common");
const _auditlogsservice = require("./audit-logs.service");
const _typeorm = require("@nestjs/typeorm");
const _auditLogentity = require("../../entities/auditLog.entity");
const _usersmodule = require("../users/users.module");
const _auditcontextservice = require("./audit-context.service");
const _bullmqmodule = require("../../bullmq/bullmq.module");
const _auditlogscontroller = require("./audit-logs.controller");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuditLogsModule = class AuditLogsModule {
};
AuditLogsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _auditLogentity.AuditLog
            ]),
            (0, _common.forwardRef)(()=>_usersmodule.UsersModule),
            (0, _common.forwardRef)(()=>_bullmqmodule.BullmqModule)
        ],
        controllers: [
            _auditlogscontroller.AuditLogsController
        ],
        providers: [
            _auditlogsservice.AuditLogsService,
            _auditcontextservice.AuditContextService
        ],
        exports: [
            _auditlogsservice.AuditLogsService,
            _auditcontextservice.AuditContextService
        ]
    })
], AuditLogsModule);

//# sourceMappingURL=audit-logs.module.js.map