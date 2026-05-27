"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SpecialtiesMapper", {
    enumerable: true,
    get: function() {
        return SpecialtiesMapper;
    }
});
const _classtransformer = require("class-transformer");
const _specialtyResponsedto = require("./dto/response/specialtyResponse.dto");
let SpecialtiesMapper = class SpecialtiesMapper {
    static toSpecialtyResponseDto(specialty) {
        return (0, _classtransformer.plainToInstance)(_specialtyResponsedto.SpecialtyResponseDto, specialty, {
            excludeExtraneousValues: true
        });
    }
    static toSpecialtyResponseDtoList(specialties) {
        return (0, _classtransformer.plainToInstance)(_specialtyResponsedto.SpecialtyResponseDto, specialties, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=specialties.mapper.js.map