"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorSchedulesService", {
    enumerable: true,
    get: function() {
        return DoctorSchedulesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctorSchedule.entity"));
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _toMinutes = require("../../utils/toMinutes");
const _doctorschedulesmapper = require("./doctor-schedules.mapper");
const _doctorsservice = require("../doctors/doctors.service");
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
let DoctorSchedulesService = class DoctorSchedulesService {
    async create(userId, bodyCreateSchedule) {
        try {
            const doctor = await this.doctorsService.findDoctorByUserId(userId);
            const startMinutes = (0, _toMinutes.toMinutes)(bodyCreateSchedule.start_time);
            const endMinutes = (0, _toMinutes.toMinutes)(bodyCreateSchedule.end_time);
            const schedulesExists = await this.doctorScheduleRepo.find({
                where: {
                    doctor: {
                        id: doctor.id
                    },
                    day_of_week: bodyCreateSchedule.day_of_week
                }
            });
            const isOverlap = schedulesExists.some((s)=>{
                const sStart = (0, _toMinutes.toMinutes)(s.start_time);
                const sEnd = (0, _toMinutes.toMinutes)(s.end_time);
                return endMinutes > sStart && startMinutes < sEnd;
            });
            if (isOverlap) {
                throw new _common.ConflictException('Khoảng thời gian này bị trùng với ca khám đã có.');
            }
            const newSchedule = await this.doctorScheduleRepo.save({
                ...bodyCreateSchedule,
                is_active: true,
                doctor
            });
            return _doctorschedulesmapper.DoctorScheduleMapper.toDoctorScheduleResponseDto(newSchedule);
        } catch (error) {
            if (error.code === '23505') {
                throw new _common.ConflictException('Đã có lịch khám bị trùng vào thời gian này!');
            }
            throw error;
        }
    }
    async update(userId, doctorScheduleId, bodyUpdateSchedule) {
        const doctor = await this.doctorsService.findDoctorByUserId(userId);
        const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
        const startMinutes = (0, _toMinutes.toMinutes)(bodyUpdateSchedule.start_time);
        const endMinutes = (0, _toMinutes.toMinutes)(bodyUpdateSchedule.end_time);
        if (startMinutes >= endMinutes) {
            throw new _common.BadRequestException('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
        }
        const schedulesExists = await this.doctorScheduleRepo.find({
            where: {
                doctor: {
                    id: doctor.id
                },
                day_of_week: bodyUpdateSchedule.day_of_week
            }
        });
        const isOverlap = schedulesExists.some((item)=>{
            if (item.id === doctorScheduleId) {
                return false;
            }
            const itemStart = (0, _toMinutes.toMinutes)(item.start_time);
            const itemEnd = (0, _toMinutes.toMinutes)(item.end_time);
            return endMinutes > itemStart && startMinutes < itemEnd;
        });
        if (isOverlap) {
            throw new _common.ConflictException('Khoảng thời gian này bị trùng với ca khám đã có.');
        }
        Object.assign(schedule, bodyUpdateSchedule);
        return this.doctorScheduleRepo.save(schedule);
    }
    async getDoctorScheduleDetail(scheduleId) {
        const schedule = await this.findScheduleByDoctorScheduleId(scheduleId);
        return _doctorschedulesmapper.DoctorScheduleMapper.toDoctorScheduleResponseDto(schedule);
    }
    async updateActive(userId, doctorScheduleId, isActive) {
        const doctor = await this.doctorsService.findDoctorByUserId(userId);
        const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
        if (schedule.is_active === isActive) {
            return {
                message: 'Trạng thái ca khám không thay đổi.'
            };
        }
        await this.doctorScheduleRepo.update(doctorScheduleId, {
            is_active: isActive
        });
        return {
            message: isActive ? 'Kích hoạt ca khám thành công.' : 'Ngừng kích hoạt ca khám thành công.'
        };
    }
    async remove(userId, doctorScheduleId) {
        const doctor = await this.doctorsService.findDoctorByUserId(userId);
        const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
        await this.doctorScheduleRepo.delete(schedule.id);
        return {
            message: 'Xóa ca khám thành công.'
        };
    }
    async getSchedulesByDoctorId(doctorId) {
        const doctor = await this.doctorsService.findByDoctorId(doctorId);
        if (!doctor) {
            throw new _common.NotFoundException('Bác sĩ không tồn tại trong hệ thống.');
        }
        const schedules = await this.doctorScheduleRepo.createQueryBuilder('schedule').leftJoinAndSelect('schedule.appointments', 'appointment').where('schedule.doctor_id = :doctorId', {
            doctorId
        }).select([
            'schedule.id',
            'schedule.day_of_week',
            'schedule.start_time',
            'schedule.end_time',
            'schedule.is_active',
            'appointment'
        ]).orderBy('schedule.day_of_week', 'ASC').addOrderBy('schedule.start_time', 'ASC').getMany();
        return _doctorschedulesmapper.DoctorScheduleMapper.toDoctorScheduleResponseDtoList(schedules);
    }
    async getPersonalSchedules(userId) {
        const doctor = await this.doctorsService.findDoctorByUserId(userId);
        return this.getSchedulesByDoctorId(doctor.id);
    }
    async findScheduleByDoctorScheduleId(doctorScheduleId) {
        const schedule = await this.doctorScheduleRepo.findOne({
            where: {
                id: doctorScheduleId
            }
        });
        if (!schedule) {
            throw new _common.NotFoundException('Ca khám không tồn tại.');
        }
        return schedule;
    }
    async isScheduleExists(doctorScheduleId) {
        const schedule = await this.doctorScheduleRepo.findOne({
            where: {
                id: doctorScheduleId
            }
        });
        return !!schedule;
    }
    async findOwnedSchedule(doctorId, doctorScheduleId) {
        const schedule = await this.doctorScheduleRepo.findOne({
            where: {
                id: doctorScheduleId,
                doctor: {
                    id: doctorId
                }
            }
        });
        if (!schedule) {
            throw new _common.NotFoundException('Ca khám không tồn tại.');
        }
        return schedule;
    }
    constructor(doctorScheduleRepo, doctorsService, redisCacheService){
        this.doctorScheduleRepo = doctorScheduleRepo;
        this.doctorsService = doctorsService;
        this.redisCacheService = redisCacheService;
    }
};
DoctorSchedulesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_doctorScheduleentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _doctorsservice.DoctorsService === "undefined" ? Object : _doctorsservice.DoctorsService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], DoctorSchedulesService);

//# sourceMappingURL=doctor-schedules.service.js.map