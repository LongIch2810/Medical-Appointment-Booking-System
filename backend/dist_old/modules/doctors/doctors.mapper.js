"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DoctorsMapper", {
    enumerable: true,
    get: function() {
        return DoctorsMapper;
    }
});
const _doctorResponsedto = require("./dto/response/doctorResponse.dto");
const _classtransformer = require("class-transformer");
const _doctorInformationResponsedto = require("./dto/response/doctorInformationResponse.dto");
let DoctorsMapper = class DoctorsMapper {
    static toDoctorResponseDto(doctor) {
        return (0, _classtransformer.plainToInstance)(_doctorResponsedto.DoctorResponseDto, {
            ...doctor.user,
            ...doctor,
            user_id: doctor.user.id
        }, {
            excludeExtraneousValues: true
        });
    }
    static toDoctorInformationResponseDto(doctor) {
        return (0, _classtransformer.plainToInstance)(_doctorInformationResponsedto.DoctorInformationResponseDto, doctor, {
            excludeExtraneousValues: true
        });
    }
    static toDoctorInformationResponseDtoList(doctors) {
        return (0, _classtransformer.plainToInstance)(_doctorInformationResponsedto.DoctorInformationResponseDto, doctors, {
            excludeExtraneousValues: true
        });
    }
    static toDoctorResponseDtoList(doctors) {
        return (0, _classtransformer.plainToInstance)(_doctorResponsedto.DoctorResponseDto, doctors.map((doctor)=>({
                ...doctor.user,
                ...doctor,
                user_id: doctor.user.id
            })), {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=doctors.mapper.js.map