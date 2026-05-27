"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentsService", {
    enumerable: true,
    get: function() {
        return AppointmentsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _appointmententity = /*#__PURE__*/ _interop_require_default(require("../../entities/appointment.entity"));
const _typeorm1 = require("typeorm");
const _doctorScheduleentity = /*#__PURE__*/ _interop_require_default(require("../../entities/doctorSchedule.entity"));
const _appointmentStatus = require("../../shared/enums/appointmentStatus");
const _dayOfWeek = require("../../shared/enums/dayOfWeek");
const _rediscacheservice = require("../../redis-cache/redis-cache.service");
const _websocketgateway = require("../../websockets/websocket.gateway");
const _usersservice = require("../users/users.service");
const _doctorschedulesservice = require("../doctor-schedules/doctor-schedules.service");
const _relativesservice = require("../relatives/relatives.service");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
const _appointmentsmapper = require("./appointments.mapper");
const _isPgDriverError = require("../../utils/isPgDriverError");
const _relativeentity = /*#__PURE__*/ _interop_require_default(require("../../entities/relative.entity"));
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
let AppointmentsService = class AppointmentsService {
    async createWithNotifications(userId, body) {
        try {
            const newAppointment = await this.create(userId, body);
            this.gateway.notifyBookAppointmentSuccess(userId, newAppointment);
            return newAppointment;
        } catch (error) {
            let isPgUnique = false;
            if (error instanceof _typeorm1.QueryFailedError) {
                const driverError = error.driverError;
                if ((0, _isPgDriverError.isPgDriverError)(driverError)) {
                    isPgUnique = driverError.code === '23505' && driverError.constraint === 'unique_doctor_schedule_date';
                }
            }
            if (!isPgUnique) {
                this.gateway.notifyBookAppointmentFail(userId, 'Đặt lịch khám đã có lỗi xảy ra !');
                console.log('Error booking appointment:', error);
                throw error;
            }
            this.gateway.notifyBookAppointmentFail(userId, 'Ca này đã có lịch hẹn! Vui lòng chọn ca khác.');
            throw new _common.ConflictException('Ca này đã có lịch hẹn! Vui lòng chọn ca khác.');
        }
    }
    async create(userId, body) {
        return this.dataSource.transaction(async (manager)=>{
            const user_booked = await this.usersService.findByUserId(userId);
            if (!user_booked) throw new _common.NotFoundException('Không tìm thấy người dùng.');
            const { appointment_date, relative_id, booking_mode, doctor_schedule_id } = body;
            const appointmentDateOnly = appointment_date.slice(0, 10);
            const appointmentDate = new Date(`${appointmentDateOnly}T00:00:00`);
            const now = new Date();
            const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (appointmentDay < today) {
                throw new _common.BadRequestException('Ngày đặt lịch không được là ngày trong quá khứ.');
            }
            const patient = await manager.getRepository(_relativeentity.default).createQueryBuilder('relative').setLock('pessimistic_write').where('relative.id = :relative_id', {
                relative_id
            }).andWhere('relative.user.id = :userId', {
                userId
            }).getOne();
            if (!patient) throw new _common.NotFoundException('Không tìm thấy bệnh nhân.');
            const chosenSchedule = await manager.findOne(_doctorScheduleentity.default, {
                where: {
                    id: doctor_schedule_id,
                    is_active: true
                }
            });
            if (!chosenSchedule) throw new _common.NotFoundException('Bác sĩ nghỉ hoặc không có làm việc trong ngày bạn yêu cầu !');
            const appointmentDayOfWeek = _dayOfWeek.dayNumberToEnum[appointmentDate.getDay()];
            if (chosenSchedule.day_of_week !== appointmentDayOfWeek) {
                throw new _common.BadRequestException('Ca khám không khớp với ngày mà bạn yêu cầu. Vui lòng chọn ca khác.');
            }
            const patientConflict = await manager.getRepository(_appointmententity.default).createQueryBuilder('appointment').innerJoin('appointment.doctor_schedule', 'doctor_schedule').where('appointment.patient.id = :patientId', {
                patientId: patient.id
            }).andWhere('DATE(appointment.appointment_date) = :appointmentDate', {
                appointmentDate: appointmentDateOnly
            }).andWhere('doctor_schedule.start_time < :new_end_time', {
                new_end_time: chosenSchedule.end_time
            }).andWhere('doctor_schedule.end_time > :new_start_time', {
                new_start_time: chosenSchedule.start_time
            }).andWhere('appointment.status IN (:...statuses)', {
                statuses: [
                    _appointmentStatus.AppointmentStatus.PENDING,
                    _appointmentStatus.AppointmentStatus.CONFIRMED
                ]
            }).getOne();
            if (patientConflict) {
                throw new _common.ConflictException('Bệnh nhân đã có lịch hẹn khác vào thời gian này.');
            }
            const appointment = manager.create(_appointmententity.default, {
                appointment_date: appointmentDate,
                doctor_schedule: chosenSchedule,
                booked_by_user: user_booked,
                patient,
                booking_mode
            });
            const saved = await manager.save(_appointmententity.default, appointment);
            const appointmentDetail = await this.getAppointmentDetailTransaction(manager, userId, saved.id);
            return appointmentDetail;
        });
    }
    async cancel(userId, appointmentId) {
        const isExistsAndPending = await this.isAppointmentExistAndPending(userId, appointmentId);
        if (!isExistsAndPending) {
            throw new _common.NotFoundException('Không tìm thấy lịch hẹn hoặc bạn không thể hủy lịch này.');
        }
        await this.appointmentRepo.update(appointmentId, {
            status: _appointmentStatus.AppointmentStatus.CANCELLED
        });
        const cancelledAppointment = await this.getAppointmentDetail(userId, appointmentId);
        return cancelledAppointment;
    }
    async findPersonalAppointments(userId, objectFilters) {
        let { page, limit } = objectFilters;
        const { appointmentStatus, relativeId } = objectFilters;
        const user = await this.usersService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        // const cacheKey = `appointments:${userId}:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        const query = this.baseAppointmentQuery().where('appointment.booked_by_user.id = :userId', {
            userId
        }).orderBy('appointment.appointment_date', 'ASC').take(limit).skip(skip);
        if (appointmentStatus) {
            query.andWhere('appointment.status = :status', {
                status: appointmentStatus
            });
        }
        if (relativeId) {
            query.andWhere('appointment.patient.id = :relativeId', {
                relativeId
            });
        }
        const [appointments, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('appointments', _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDtoList(appointments), total, page, limit);
        // await this.redisCacheService.setData(cacheKey, result, 3600);
        return result;
    }
    async findAndPaginationOfDoctor(userId, objectFilters) {
        let { page, limit } = objectFilters;
        const { appointmentStatus, relativeId, bookerId } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const user = await this.usersService.findByUserId(userId);
        if (!user) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        if (!user.doctor.id) {
            throw new _common.NotFoundException('Người dùng không phải là bác sĩ.');
        }
        const query = this.baseAppointmentQuery().where('doctor.id = :doctorId', {
            doctorId: user.doctor.id
        }).orderBy('appointment.appointment_date', 'ASC').take(limit).skip(skip);
        if (appointmentStatus) {
            query.andWhere('appointment.status = :status', {
                status: appointmentStatus
            });
        }
        if (relativeId) {
            query.andWhere('appointment.patient.id = :relativeId', {
                relativeId
            });
        }
        if (bookerId) {
            query.andWhere('appointment.booked_by_user.id = :bookerId', {
                bookerId
            });
        }
        const [appointments, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('appointments', _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDtoList(appointments), total, page, limit);
        return result;
    }
    async filterAndPaginationOfAdmin(objectFilters) {
        let { page, limit } = objectFilters;
        const { appointmentStatus, relativeId, bookerId, doctorId, appointmentDate } = objectFilters;
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const skip = (page - 1) * limit;
        const query = this.baseAppointmentQuery().orderBy('appointment.appointment_date', 'ASC').take(limit).skip(skip);
        if (appointmentStatus) {
            query.andWhere('appointment.status = :status', {
                status: appointmentStatus
            });
        }
        if (relativeId) {
            query.andWhere('appointment.patient.id = :relativeId', {
                relativeId
            });
        }
        if (bookerId) {
            query.andWhere('appointment.booked_by_user.id = :bookerId', {
                bookerId
            });
        }
        if (appointmentDate) {
            const appointmentDateOnly = appointmentDate.slice(0, 10);
            query.andWhere('appointment.appointment_date = :appointmentDate', {
                appointmentDate: appointmentDateOnly
            });
        }
        if (doctorId) {
            query.andWhere('doctor.id = :doctorId', {
                doctorId
            });
        }
        const [appointments, total] = await query.getManyAndCount();
        const result = new _paginationResultdto.PaginationResultDto('appointments', _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDtoList(appointments), total, page, limit);
        return result;
    }
    async updateStatus(appointmentId, status) {
        const appointment = await this.baseAppointmentQuery().where('appointment.id = :appointmentId', {
            appointmentId
        }).getOne();
        if (!appointment) {
            throw new _common.NotFoundException('Lịch hẹn không tồn tại.');
        }
        appointment.status = status;
        await this.appointmentRepo.save(appointment);
        const updatedAppointment = await this.baseAppointmentQuery().where('appointment.id = :appointmentId', {
            appointmentId
        }).getOne();
        return _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDto(updatedAppointment);
    }
    async getAppointmentDetail(userId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        // const cacheKey = `user:${userId}:appointment:${appointmentId}`;
        // const cachedData = await this.redisCacheService.getData(cacheKey);
        // if (cachedData) {
        //   return cachedData;
        // }
        const appointment = await this.baseAppointmentQuery().where('appointment.id = :appointmentId', {
            appointmentId
        }).andWhere('bookedByUser.id = :userId', {
            userId
        }).getOne();
        if (!appointment) {
            throw new _common.NotFoundException('Lịch hẹn không tồn tại.');
        }
        // await this.redisCacheService.setData(cacheKey, appointment, 3600);
        return _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDto(appointment);
    }
    async getAppoitnmentToDayEarlyOfDoctor(userId, doctorId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appointment = await this.baseAppointmentQuery().where('doctor.id = :doctorId', {
            doctorId
        }).andWhere('appointment.appointment_date = :today', {
            today
        }).orderBy('appointment.appointment_date', 'ASC').getOne();
        if (!appointment) {
            throw new _common.NotFoundException('Lịch hẹn không tồn tại.');
        }
        return _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDto(appointment);
    }
    async isAppointmentExists(userId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                booked_by_user: {
                    id: userId
                }
            }
        });
        return !!appointment;
    }
    async isAppointmentExistAndPending(userId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                status: _appointmentStatus.AppointmentStatus.PENDING,
                booked_by_user: {
                    id: userId
                }
            }
        });
        return !!appointment;
    }
    async isAppointmentExistsAndCompleted(userId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                status: _appointmentStatus.AppointmentStatus.COMPLETED,
                booked_by_user: {
                    id: userId
                }
            }
        });
        return !!appointment;
    }
    async isAppointmentCompletedById(appointmentId) {
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                status: _appointmentStatus.AppointmentStatus.COMPLETED
            }
        });
        return !!appointment;
    }
    async isAppointmentCompletedAndOwnedByDoctorUser(doctorUserId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(doctorUserId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const appointment = await this.appointmentRepo.findOne({
            where: {
                id: appointmentId,
                status: _appointmentStatus.AppointmentStatus.COMPLETED,
                doctor_schedule: {
                    doctor: {
                        user: {
                            id: doctorUserId
                        }
                    }
                }
            }
        });
        return !!appointment;
    }
    async isAppointmentExistsCompletedAndResult(userId, appointmentId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) {
            throw new _common.NotFoundException('Không tìm thấy người dùng.');
        }
        const appointment = await this.appointmentRepo.createQueryBuilder('appointment').innerJoinAndSelect('appointment.examination_result', 'examinationResult').where('appointment.id = :appointmentId', {
            appointmentId
        }).andWhere('appointment.status = :status', {
            status: _appointmentStatus.AppointmentStatus.COMPLETED
        }).andWhere('appointment.booked_by_user = :userId', {
            userId
        }).getOne();
        return !!appointment;
    }
    async numberOfUpcomingAppointmentsByUserId(userId) {
        const isUserExist = await this.usersService.isUserExists(userId);
        if (!isUserExist) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.appointmentRepo.count({
            where: {
                booked_by_user: {
                    id: userId
                },
                appointment_date: (0, _typeorm1.MoreThanOrEqual)(today),
                status: (0, _typeorm1.In)([
                    _appointmentStatus.AppointmentStatus.CONFIRMED,
                    _appointmentStatus.AppointmentStatus.PENDING
                ])
            }
        });
        return count;
    }
    async getAppointmentDetailTransaction(manager, userId, appointmentId) {
        const appointment = await manager.getRepository(_appointmententity.default).createQueryBuilder('appointment').leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule').leftJoinAndSelect('appointment.patient', 'patient').leftJoinAndSelect('doctorSchedule.doctor', 'doctor').leftJoinAndSelect('doctor.user', 'doctorUser').leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser').leftJoinAndSelect('doctor.specialty', 'specialty').where('appointment.id = :appointmentId', {
            appointmentId
        }).andWhere('bookedByUser.id = :userId', {
            userId
        }).getOne();
        if (!appointment) {
            throw new _common.NotFoundException('Lịch hẹn không tồn tại.');
        }
        return _appointmentsmapper.AppointmentsMapper.toAppointmentResponseDto(appointment);
    }
    async numberOfAppointmentsToDayActive() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.appointmentRepo.count({
            where: {
                appointment_date: (0, _typeorm1.Equal)(today),
                status: (0, _typeorm1.In)([
                    _appointmentStatus.AppointmentStatus.CONFIRMED,
                    _appointmentStatus.AppointmentStatus.PENDING
                ])
            }
        });
        return count;
    }
    async numberOfAppointmentsToDayCancelled() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.appointmentRepo.count({
            where: {
                appointment_date: (0, _typeorm1.Equal)(today),
                status: _appointmentStatus.AppointmentStatus.CANCELLED
            }
        });
        return count;
    }
    async numberOfAppointmentsToDayActiveByDoctorId(doctorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.appointmentRepo.count({
            where: {
                appointment_date: (0, _typeorm1.Equal)(today),
                status: (0, _typeorm1.In)([
                    _appointmentStatus.AppointmentStatus.CONFIRMED,
                    _appointmentStatus.AppointmentStatus.PENDING
                ]),
                doctor_schedule: {
                    doctor: {
                        id: doctorId
                    }
                }
            }
        });
        return count;
    }
    async numberOfUpcomingAppointmentsByDoctorId(doctorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.appointmentRepo.count({
            where: {
                appointment_date: (0, _typeorm1.MoreThanOrEqual)(today),
                status: (0, _typeorm1.In)([
                    _appointmentStatus.AppointmentStatus.CONFIRMED,
                    _appointmentStatus.AppointmentStatus.PENDING
                ]),
                doctor_schedule: {
                    doctor: {
                        id: doctorId
                    }
                }
            }
        });
        return count;
    }
    baseAppointmentQuery() {
        return this.appointmentRepo.createQueryBuilder('appointment').leftJoinAndSelect('appointment.doctor_schedule', 'doctorSchedule').leftJoinAndSelect('appointment.patient', 'patient').leftJoinAndSelect('doctorSchedule.doctor', 'doctor').leftJoinAndSelect('doctor.user', 'doctorUser').leftJoinAndSelect('appointment.booked_by_user', 'bookedByUser').leftJoinAndSelect('doctor.specialty', 'specialty').leftJoinAndSelect('appointment.examination_result', 'examinationResult').leftJoinAndSelect('appointment.satisfaction_rating', 'satisfactionRating');
    }
    constructor(appointmentRepo, usersService, doctorSchedulesService, relativesService, redisCacheService, dataSource, gateway){
        this.appointmentRepo = appointmentRepo;
        this.usersService = usersService;
        this.doctorSchedulesService = doctorSchedulesService;
        this.relativesService = relativesService;
        this.redisCacheService = redisCacheService;
        this.dataSource = dataSource;
        this.gateway = gateway;
    }
};
AppointmentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_appointmententity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _doctorschedulesservice.DoctorSchedulesService === "undefined" ? Object : _doctorschedulesservice.DoctorSchedulesService,
        typeof _relativesservice.RelativesService === "undefined" ? Object : _relativesservice.RelativesService,
        typeof _rediscacheservice.RedisCacheService === "undefined" ? Object : _rediscacheservice.RedisCacheService,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource,
        typeof _websocketgateway.WebsocketGateway === "undefined" ? Object : _websocketgateway.WebsocketGateway
    ])
], AppointmentsService);

//# sourceMappingURL=appointments.service.js.map