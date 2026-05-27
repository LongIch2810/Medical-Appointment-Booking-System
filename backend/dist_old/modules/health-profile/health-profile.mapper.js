"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthProfileMapper", {
    enumerable: true,
    get: function() {
        return HealthProfileMapper;
    }
});
const _healthProfileResponsedto = require("./dto/response/healthProfileResponse.dto");
const _classtransformer = require("class-transformer");
let HealthProfileMapper = class HealthProfileMapper {
    static toHealthProfileResponseDto(healthProfile) {
        return (0, _classtransformer.plainToInstance)(_healthProfileResponsedto.HealthProfileResponseDto, healthProfile, {
            excludeExtraneousValues: true
        });
    }
    static toHealthProfileResponseDtoList(healthProfiles) {
        return (0, _classtransformer.plainToInstance)(_healthProfileResponsedto.HealthProfileResponseDto, healthProfiles, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=health-profile.mapper.js.map