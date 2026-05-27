"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelativesMapper", {
    enumerable: true,
    get: function() {
        return RelativesMapper;
    }
});
const _relativeResponsedto = require("./dto/response/relativeResponse.dto");
const _classtransformer = require("class-transformer");
let RelativesMapper = class RelativesMapper {
    static toRelativeResponseDto(relative) {
        return (0, _classtransformer.plainToInstance)(_relativeResponsedto.RelativeResponseDto, relative, {
            excludeExtraneousValues: true
        });
    }
    static toRelativeResponseDtoList(relatives) {
        return (0, _classtransformer.plainToInstance)(_relativeResponsedto.RelativeResponseDto, relatives, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=relatives.mapper.js.map