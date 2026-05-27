"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorsService", {
    enumerable: true,
    get: function() {
        return DoctorsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _doctorentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctor.entity"));
const _typeorm1 = require("typeorm");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _appointmentStatus = require("../../shared/enums/appointmentStatus");
const _setIsOutstanding = require("../../utils/setIsOutstanding");
const _doctorsmapper = require("./doctors.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _userentity = /*#__PURE__*/ _interop_require_default(require("../../entities/user.entity"));
const _specialtyentity = /*#__PURE__*/ _interop_require_default(require("../../entities/specialty.entity"));
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
let DoctorsService = class DoctorsService {
    async create(body) {
        const user = await this.userRepo.findOne({
            where: {
                id: body.user_id
            }
        });
        if (!user) {
            throw new _common.NotFoundException('Người dùng không tồn tại.');
        }
        const specialty = await this.specialtyRepo.findOne({
            where: {
                id: body.specialty_id
            }
        });
        if (!specialty) {
            throw new _common.NotFoundException('Chuyên khoa không tồn tại.');
        }
        const existedDoctor = await this.doctorRepo.findOne({
            where: {
                user: {
                    id: body.user_id
                }
            }
        });
        if (existedDoctor) {
            throw new _common.ConflictException('Người dùng đã là bác sĩ.');
        }
        const doctor = this.doctorRepo.create({
            experience: body.experience,
            about_me: body.about_me,
            workplace: body.workplace,
            doctor_level: body.doctor_level,
            user,
            specialty
        });
        const newDoctor = await this.doctorRepo.save(doctor);
        return this.getDoctorDetail(newDoctor.id);
    }
    async findByDoctorId(doctorId) {
        const doctor = await this.doctorRepo.findOne({
            where: {
                id: doctorId
            }
        });
        return doctor;
    }
    async findDoctorByUserId(userId) {
        const doctor = await this.doctorRepo.findOne({
            where: {
                user: {
                    id: userId
                }
            }
        });
        if (!doctor) {
            throw new _common.NotFoundException('Bác sĩ không tồn tại.');
        }
        return doctor;
    }
    async filterAndPagination(objectFilter) {
        const { specialty_id, min_experience, max_experience, workplace, area, search } = objectFilter;
        let { page, limit } = objectFilter;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        // const cacheKey = `doctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilter || {})}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        const doctorsQuery = this.baseDoctorQuery().take(limit).skip(skip);
        const totalQuery = this.baseTotalDoctorQuery();
        const filters = [
            specialty_id && {
                condition: 'specialty.id = :specialty_id',
                value: specialty_id,
                key: 'specialty_id'
            },
            min_experience && {
                condition: 'doctor.experience >= :min_experience',
                value: min_experience,
                key: 'min_experience'
            },
            max_experience && {
                condition: 'doctor.experience <= :max_experience',
                value: max_experience,
                key: 'max_experience'
            },
            workplace && {
                condition: 'LOWER(doctor.workplace) LIKE LOWER(:workplace)',
                value: `%${workplace}%`,
                key: 'workplace'
            },
            area && {
                condition: 'LOWER(user.address) LIKE LOWER(:area)',
                value: `%${area}%`,
                key: 'area'
            },
            search && {
                condition: 'LOWER(user.fullname) LIKE LOWER(:search)',
                value: `%${search}%`,
                key: 'search'
            }
        ].filter(Boolean);
        filters.forEach(({ condition, value, key })=>{
            doctorsQuery.andWhere(condition, {
                [key]: value
            });
            totalQuery.andWhere(condition, {
                [key]: value
            });
        });
        const { entities, raw } = await doctorsQuery.getRawAndEntities();
        const total = await totalQuery.getCount();
        const doctors = entities.map((doctor)=>{
            const row = raw.find((i)=>Number(i.doctor_id) === doctor.id);
            return {
                ...doctor,
                avg_rating: Number(row?.avg_rating ?? 0),
                appointments_completed: Number(row?.appointments_completed ?? 0)
            };
        });
        const result = new _paginationResultdto.PaginationResultDto('doctors', _doctorsmapper.DoctorsMapper.toDoctorResponseDtoList((0, _setIsOutstanding.setIsOutstandingDoctors)(doctors)), total, page, limit);
        // await this.redisCacheService.setData(cacheKey, result);
        return result;
    }
    async getDoctorDetail(doctorId) {
        // const cacheKey = `doctor:${doctorId}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) return cachedData;
        const { entities, raw } = await this.baseDoctorQuery().where('doctor.id = :doctorId', {
            doctorId
        }).getRawAndEntities();
        if (entities.length === 0) {
            throw new _common.NotFoundException('Bác sĩ không tồn tại.');
        }
        const row = raw.find((i)=>Number(i.doctor_id) === doctorId);
        // await this.redisCacheService.setData(cacheKey, doctor, 3600);
        const doctor = {
            ...entities[0],
            avg_rating: Number(row?.avg_rating ?? 0),
            appointments_completed: Number(row?.appointments_completed ?? 0)
        };
        return _doctorsmapper.DoctorsMapper.toDoctorResponseDto((0, _setIsOutstanding.setIsOutstandingDoctor)(doctor));
    }
    async update(doctorId, body) {
        const doctor = await this.doctorRepo.findOne({
            where: {
                id: doctorId
            },
            relations: [
                'user',
                'specialty'
            ]
        });
        if (!doctor) {
            throw new _common.NotFoundException('Bác sĩ không tồn tại.');
        }
        if (body.specialty_id !== undefined) {
            const specialty = await this.specialtyRepo.findOne({
                where: {
                    id: body.specialty_id
                }
            });
            if (!specialty) {
                throw new _common.NotFoundException('Chuyên khoa không tồn tại.');
            }
            doctor.specialty = specialty;
        }
        if (body.experience !== undefined) doctor.experience = body.experience;
        if (body.about_me !== undefined) doctor.about_me = body.about_me;
        if (body.workplace !== undefined) doctor.workplace = body.workplace;
        if (body.doctor_level !== undefined) doctor.doctor_level = body.doctor_level;
        await this.doctorRepo.save(doctor);
        return this.getDoctorDetail(doctorId);
    }
    async remove(doctorId) {
        await this.getDoctorDetail(doctorId);
        await this.doctorRepo.softDelete(doctorId);
        return {
            message: 'Xóa bác sĩ thành công.'
        };
    }
    async getOutstandingDoctors() {
        // const outstandingDoctorsCached = await this.redisCacheService.getData(
        //   `doctors:outstandingDoctors`,
        // );
        // if (outstandingDoctorsCached) return outstandingDoctorsCached;
        const query = this.baseDoctorQuery().orderBy('avg_rating', 'DESC').addOrderBy('appointments_completed', 'DESC');
        const { entities, raw } = await query.getRawAndEntities();
        const outstandingDoctors = entities.map((doctor)=>{
            const row = raw.find((i)=>Number(i.doctor_id) === doctor.id);
            return {
                ...doctor,
                avg_rating: Number(row?.avg_rating ?? 0),
                appointments_completed: Number(row?.appointments_completed ?? 0)
            };
        });
        // await this.redisCacheService.setData(
        //   `doctors:outstandingDoctors`,
        //   outstandingDoctors,
        // );
        return _doctorsmapper.DoctorsMapper.toDoctorResponseDtoList((0, _setIsOutstanding.setIsOutstandingDoctors)(outstandingDoctors).filter((doctor)=>doctor.isOutstanding).slice(0, 4));
    }
    baseDoctorQuery() {
        const subquery = this.doctorRepo.createQueryBuilder('d').subQuery().select('ds.doctor_id', 'doctor_id').addSelect('COUNT(ap.id)', 'appointments_completed').addSelect('COALESCE(AVG(rating.rating_score), 0)', 'avg_rating').from('doctor_schedules', 'ds').leftJoin('ds.appointments', 'ap', 'ap.status = :status').leftJoin('ap.satisfaction_rating', 'rating').groupBy('ds.doctor_id').getQuery();
        return this.doctorRepo.createQueryBuilder('doctor').leftJoinAndSelect('doctor.user', 'user').leftJoinAndSelect('doctor.doctor_schedules', 'doctor_schedules').leftJoinAndSelect('doctor.specialty', 'specialty').leftJoin(`(${subquery})`, 'doctor_stats', 'doctor_stats.doctor_id = doctor.id').setParameters({
            status: _appointmentStatus.AppointmentStatus.COMPLETED
        }).addSelect('COALESCE(doctor_stats.avg_rating, 0)', 'avg_rating').addSelect('COALESCE(doctor_stats.appointments_completed, 0)', 'appointments_completed');
    }
    baseTotalDoctorQuery() {
        return this.doctorRepo.createQueryBuilder('doctor').leftJoin('doctor.user', 'user').leftJoin('doctor.specialty', 'specialty');
    }
    constructor(doctorRepo, userRepo, specialtyRepo, redisCacheService){
        this.doctorRepo = doctorRepo;
        this.userRepo = userRepo;
        this.specialtyRepo = specialtyRepo;
        this.redisCacheService = redisCacheService;
    }
};
DoctorsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_doctorentity.default)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_userentity.default)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_specialtyentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService
    ])
], DoctorsService);

//# sourceMappingURL=doctors.service.js.map