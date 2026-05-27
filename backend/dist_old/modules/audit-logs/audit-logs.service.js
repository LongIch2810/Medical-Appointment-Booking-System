"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditLogsService", {
    enumerable: true,
    get: function() {
        return AuditLogsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _auditLogentity = require("../../entities/auditLog.entity");
const _typeorm1 = require("typeorm");
const _usersservice = require("../users/users.service");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _auditlogsmapper = require("./audit-logs.mapper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AuditLogsService = class AuditLogsService {
    async create(data) {
        const { user_id, ...rest } = data;
        if (user_id) {
            const isExistUser = await this.usersService.isUserExists(user_id);
            if (!isExistUser) {
                throw new _common.NotFoundException(`Không tìm thấy người dùng với id ${user_id}`);
            }
        }
        const createdAuditLog = this.auditLogRepo.create({
            ...rest,
            user: user_id ? {
                id: user_id
            } : null
        });
        const newAuditLog = await this.auditLogRepo.save(createdAuditLog);
        return newAuditLog;
    }
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { search, action, entityName, userId, method, isSuccess, fromDate, toDate, arrange } = objectFilters;
        page = Math.max(1, Number(page) || 1);
        limit = Math.max(1, Number(limit) || 10);
        const skip = (page - 1) * limit;
        const query = this.auditLogRepo.createQueryBuilder('auditLog').leftJoinAndSelect('auditLog.user', 'user').orderBy('auditLog.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (search) {
            query.andWhere(`(auditLog.action ILIKE :search OR auditLog.entity_name ILIKE :search OR auditLog.endpoint ILIKE :search OR auditLog.method ILIKE :search OR auditLog.error_message ILIKE :search)`, {
                search: `%${search}%`
            });
        }
        if (action) {
            query.andWhere('auditLog.action = :action', {
                action
            });
        }
        if (entityName) {
            query.andWhere('auditLog.entity_name ILIKE :entityName', {
                entityName: `%${entityName}%`
            });
        }
        if (userId) {
            query.andWhere('user.id = :userId', {
                userId
            });
        }
        if (method) {
            query.andWhere('auditLog.method = :method', {
                method: method.toUpperCase()
            });
        }
        if (isSuccess !== undefined) {
            query.andWhere('auditLog.is_success = :isSuccess', {
                isSuccess
            });
        }
        if (fromDate) {
            query.andWhere('auditLog.created_at >= :fromDate', {
                fromDate: new Date(fromDate)
            });
        }
        if (toDate) {
            query.andWhere('auditLog.created_at <= :toDate', {
                toDate: new Date(toDate)
            });
        }
        const [auditLogs, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('auditLogs', auditLogs, total, page, limit);
        return _auditlogsmapper.AuditLogsMapper.toAuditLogListResponseDto({
            auditLogs,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        });
    }
    constructor(auditLogRepo, usersService){
        this.auditLogRepo = auditLogRepo;
        this.usersService = usersService;
    }
};
AuditLogsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_auditLogentity.AuditLog)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], AuditLogsService);

//# sourceMappingURL=audit-logs.service.js.map