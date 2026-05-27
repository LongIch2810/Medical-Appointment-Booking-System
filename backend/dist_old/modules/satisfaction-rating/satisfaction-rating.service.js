"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SatisfactionRatingService", {
    enumerable: true,
    get: function() {
        return SatisfactionRatingService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _satisfactionRatingentity = /*#__PURE__*/ _interop_require_default(require("../../entities/satisfactionRating.entity"));
const _appointmentsservice = require("../appointments/appointments.service");
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
let SatisfactionRatingService = class SatisfactionRatingService {
    async create(userId, body) {
        try {
            const { rating_score, feedback, appointment_id } = body;
            const isAppointmentsExistCompletedAndResult = await this.appointmentsService.isAppointmentExistsCompletedAndResult(userId, appointment_id);
            if (!isAppointmentsExistCompletedAndResult) {
                throw new _common.BadRequestException(`Cuộc hẹn khám ${appointment_id} không tồn tại hoặc chưa hoàn thành hoặc chưa có kết quả khám.`);
            }
            const isSatisfactionRatingExist = await this.isSatisfactionRatingExist(appointment_id);
            if (isSatisfactionRatingExist) {
                throw new _common.ConflictException(`Cuộc hẹn khám ${appointment_id} đã có đánh giá.`);
            }
            const createdSatisfactionRating = this.satisfactionRatingRepo.create({
                rating_score,
                feedback,
                appointment: {
                    id: appointment_id
                }
            });
            await this.satisfactionRatingRepo.save(createdSatisfactionRating);
            return {
                message: 'Đã hoàn thành đánh giá.'
            };
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException(`Cuộc hẹn khám ${body.appointment_id} đã có đánh giá.`);
            }
            throw error;
        }
    }
    async update(satisfactionRatingId, bodyUpdateSatisfactionRating) {
        const satisfactionRating = await this.satisfactionRatingRepo.findOne({
            where: {
                id: satisfactionRatingId
            }
        });
        if (!satisfactionRating) {
            throw new _common.BadRequestException('Đánh giá không tồn tại');
        }
        Object.assign(satisfactionRating, bodyUpdateSatisfactionRating);
        return this.satisfactionRatingRepo.save(satisfactionRating);
    }
    async delete() {}
    async filterAndPagination(objectFilters) {
        let { page, limit } = objectFilters;
        const { fromDate, toDate, doctorId, arrange } = objectFilters;
        page = Math.max(page, 1);
        limit = Math.max(limit, 1);
        const skip = (page - 1) * limit;
        const query = this.satisfactionRatingRepo.createQueryBuilder('satisfaction_rating').innerJoinAndSelect('satisfaction_rating.appointment', 'appointment').innerJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule').innerJoinAndSelect('doctor_schedule.doctor', 'doctor').orderBy('satisfaction_rating.created_at', arrange.toUpperCase()).skip(skip).take(limit);
        if (fromDate) {
            query.andWhere('satisfaction_rating.created_at >= :fromDate', {
                fromDate
            });
        }
        if (toDate) {
            const toDateWithTime = new Date(toDate);
            toDateWithTime.setHours(23, 59, 59, 999);
            query.andWhere('satisfaction_rating.created_at <= :toDate', {
                toDate: toDateWithTime
            });
        }
        if (doctorId) {
            query.andWhere('doctor.id = :doctorId', {
                doctorId
            });
        }
        const [satisfactionRatings, total] = await query.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return {
            satisfactionRatings,
            total,
            page,
            limit,
            totalPages
        };
    }
    async isSatisfactionRatingExist(appointment_id) {
        const satisfactionRating = await this.satisfactionRatingRepo.findOne({
            where: {
                appointment: {
                    id: appointment_id
                }
            }
        });
        return !!satisfactionRating;
    }
    async findById(satisfactionRatingId) {
        const satisfactionRating = await this.satisfactionRatingRepo.createQueryBuilder('satisfaction_rating').leftJoinAndSelect('satisfaction_rating.appointment', 'appointment').leftJoinAndSelect('appointment.patient', 'patient').leftJoinAndSelect('appointment.doctor_schedule', 'doctor_schedule').leftJoinAndSelect('doctor_schedule.doctor', 'doctor').leftJoinAndSelect('doctor.user', 'doctor_user').select([
            'satisfaction_rating.id',
            'satisfaction_rating.rating_score',
            'satisfaction_rating.feedback',
            'satisfaction_rating.created_at',
            'appointment.id',
            'appointment.appointment_date',
            'appointment.status',
            'patient.id',
            'patient.fullname',
            'doctor.id',
            'doctor_user.fullname'
        ]).where('satisfaction_rating.id = :satisfactionRatingId', {
            satisfactionRatingId
        }).getOne();
        if (!satisfactionRating) {
            throw new _common.BadRequestException('Đánh giá không tồn tại');
        }
        return satisfactionRating;
    }
    constructor(satisfactionRatingRepo, appointmentsService){
        this.satisfactionRatingRepo = satisfactionRatingRepo;
        this.appointmentsService = appointmentsService;
    }
};
SatisfactionRatingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_satisfactionRatingentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _appointmentsservice.AppointmentsService === "undefined" ? Object : _appointmentsservice.AppointmentsService
    ])
], SatisfactionRatingService);

//# sourceMappingURL=satisfaction-rating.service.js.map