"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExaminationResultMapper", {
    enumerable: true,
    get: function() {
        return ExaminationResultMapper;
    }
});
const _examinationResultResponsedto = require("./dto/response/examinationResultResponse.dto");
const _classtransformer = require("class-transformer");
let ExaminationResultMapper = class ExaminationResultMapper {
    static toExaminationResultResponseDto(examinationResult) {
        return (0, _classtransformer.plainToInstance)(_examinationResultResponsedto.ExaminationResultResponseDto, examinationResult, {
            excludeExtraneousValues: true
        });
    }
    static toExaminationResultResponseDtoList(examinationResults) {
        return (0, _classtransformer.plainToInstance)(_examinationResultResponsedto.ExaminationResultResponseDto, examinationResults, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=examination-result.mapper.js.map