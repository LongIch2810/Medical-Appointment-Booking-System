"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppointmentsMapper", {
    enumerable: true,
    get: function() {
        return AppointmentsMapper;
    }
});
const _appointmentResponsedto = require("./dto/response/appointmentResponse.dto");
const _classtransformer = require("class-transformer");
let AppointmentsMapper = class AppointmentsMapper {
    static toAppointmentResponseDto(appointment) {
        return (0, _classtransformer.plainToInstance)(_appointmentResponsedto.AppointmentResponseDto, {
            ...appointment,
            doctor: appointment.doctor_schedule.doctor
        }, {
            excludeExtraneousValues: true
        });
    }
    static toAppointmentResponseDtoList(appointments) {
        return (0, _classtransformer.plainToInstance)(_appointmentResponsedto.AppointmentResponseDto, appointments.map((appointment)=>({
                ...appointment,
                doctor: appointment.doctor_schedule.doctor
            })), {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=appointments.mapper.js.map