"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExaminationResultService", {
    enumerable: true,
    get: function() {
        return ExaminationResultService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _examinationResultentity = /*#__PURE__*/ _interop_require_default(require("../../entities/examinationResult.entity"));
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _appointmentsservice = require("../appointments/appointments.service");
const _relativesservice = require("../relatives/relatives.service");
const _usersservice = require("../users/users.service");
const _examinationresultmapper = require("./examination-result.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let ExaminationResultService = class ExaminationResultService {
    async create(userId, body) {
        try {
            const isAppointmentExistsAndCompleted = await this.appointmentsService.isAppointmentCompletedAndOwnedByDoctorUser(userId, body.appointment_id);
            if (!isAppointmentExistsAndCompleted) {
                throw new _common.BadRequestException('Lịch khám không tồn tại, chưa hoàn thành hoặc không thuộc về bác sĩ đang đăng nhập.');
            }
            const isExaminationResultExists = await this.isExaminationResultExists(body.appointment_id);
            if (isExaminationResultExists) {
                throw new _common.BadRequestException('Kết quả khám bệnh đã tồn tại cho lịch khám này.');
            }
            const { appointment_id, ...examData } = body;
            const createdExaminationResult = this.examinationResultRepo.create({
                ...examData,
                appointment: {
                    id: appointment_id
                }
            });
            const newExaminationResult = await this.examinationResultRepo.save(createdExaminationResult);
            return _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDto(newExaminationResult);
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.BadRequestException('Kết quả khám bệnh đã tồn tại cho lịch khám này.');
            }
            throw error;
        }
    }
    async update(examinationResultId, bodyUpdateExaminationResult) {
        const examinationResult = await this.examinationResultRepo.findOne({
            where: {
                id: examinationResultId
            }
        });
        if (!examinationResult) {
            throw new _common.NotFoundException('Kết quả khám bệnh không tồn tại');
        }
        Object.assign(examinationResult, bodyUpdateExaminationResult);
        const updatedExaminationResult = await this.examinationResultRepo.save(examinationResult);
        return _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDto(updatedExaminationResult);
    }
    async remove(id) {
        const examinationResult = await this.findExaminationResultById(id);
        await this.examinationResultRepo.softDelete(examinationResult);
        const deletedExaminationResult = await this.getExaminationResultDetail(id);
        return deletedExaminationResult;
    }
    async getExaminationResultDetail(id) {
        const examinationResult = await this.findExaminationResultById(id);
        return _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDto(examinationResult);
    }
    async findExaminationResultById(id) {
        const examinationResult = await this.baseExaminationResultQuery().andWhere('examination_result.id = :id', {
            id
        }).getOne();
        if (!examinationResult) {
            throw new _common.NotFoundException('Kết quả khám bệnh không tồn tại');
        }
        return examinationResult;
    }
    async findExaminationResultByAppointmentId(appointmentId) {
        const examinationResult = await this.baseExaminationResultQuery().andWhere('appointment.id = :appointmentId', {
            appointmentId
        }).getOne();
        if (!examinationResult) {
            throw new _common.NotFoundException('Không tìm thấy kết quả khám bệnh cho lịch hẹn này');
        }
        return examinationResult;
    }
    async findExaminationResultsByRelativeId(userId, relativeId, objectFilters) {
        const isRelativeExists = await this.relativesService.isRelativeExistsByRelativeId(userId, relativeId);
        if (!isRelativeExists) {
            throw new _common.NotFoundException('Bệnh nhân không tồn tại');
        }
        let { limit, page, arrange, date } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseExaminationResultQuery().where('patient.id = :relativeId', {
            relativeId
        }).orderBy('examination_result.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (date) {
            query.andWhere('examination_result.created_at >= :date', {
                date
            });
        }
        const [examinationResults, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('examination_results', _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDtoList(examinationResults), total, page, limit);
        return result;
    }
    async findExaminationResultsByUserId(userId, objectFilters) {
        const isUserExists = await this.usersService.isUserExists(userId);
        if (!isUserExists) {
            throw new _common.NotFoundException('Người dùng không tồn tại');
        }
        let { limit, page, arrange, date, relativeId } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseExaminationResultQuery().where('user.id = :userId', {
            userId
        }).orderBy('examination_result.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (date) {
            query.andWhere('examination_result.created_at >= :date', {
                date
            });
        }
        if (relativeId) {
            query.andWhere('patient.id = :relativeId', {
                relativeId
            });
        }
        const [examinationResults, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('examination_results', _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDtoList(examinationResults), total, page, limit);
        return result;
    }
    async filterAndPagination(objectFilters) {
        let { limit, page, arrange, date, relativeId } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseExaminationResultQuery().orderBy('examination_result.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (date) {
            query.andWhere('examination_result.created_at >= :date', {
                date
            });
        }
        if (relativeId) {
            query.andWhere('patient.id = :relativeId', {
                relativeId
            });
        }
        const [examinationResults, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('examination_results', _examinationresultmapper.ExaminationResultMapper.toExaminationResultResponseDtoList(examinationResults), total, page, limit);
        return result;
    }
    async isExaminationResultExists(appointmentId) {
        const examinationResult = await this.examinationResultRepo.findOne({
            where: {
                appointment: {
                    id: appointmentId
                }
            }
        });
        return !!examinationResult;
    }
    async numberOfExaminationResultsByUserId(userId) {
        const count = await this.examinationResultRepo.count({
            where: {
                appointment: {
                    patient: {
                        user: {
                            id: userId
                        }
                    }
                }
            }
        });
        return count;
    }
    baseExaminationResultQuery() {
        return this.examinationResultRepo.createQueryBuilder('examination_result').leftJoinAndSelect('examination_result.appointment', 'appointment').leftJoinAndSelect('appointment.patient', 'patient').leftJoinAndSelect('patient.user', 'user').leftJoinAndSelect('patient.relationship', 'relationship').leftJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule').leftJoinAndSelect('doctor_schedule.doctor', 'doctor').leftJoinAndSelect('doctor.user', 'doctor_user').leftJoinAndSelect('doctor.specialty', 'specialty');
    }
    constructor(examinationResultRepo, appointmentsService, relativesService, usersService, redisCacheService){
        this.examinationResultRepo = examinationResultRepo;
        this.appointmentsService = appointmentsService;
        this.relativesService = relativesService;
        this.usersService = usersService;
        this.redisCacheService = redisCacheService;
    }
};
ExaminationResultService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_examinationResultentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _appointmentsservice.AppointmentsService === "undefined" ? Object : _appointmentsservice.AppointmentsService,
        typeof _relativesservice.RelativesService === "undefined" ? Object : _relativesservice.RelativesService,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], ExaminationResultService);

//# sourceMappingURL=examination-result.service.js.map