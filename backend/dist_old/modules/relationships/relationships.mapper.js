"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RelationshipsMapper", {
    enumerable: true,
    get: function() {
        return RelationshipsMapper;
    }
});
const _classtransformer = require("class-transformer");
const _relationshipResponsedto = require("./dto/response/relationshipResponse.dto");
let RelationshipsMapper = class RelationshipsMapper {
    static toRelationshipResponseDto(relationship) {
        return (0, _classtransformer.plainToInstance)(_relationshipResponsedto.RelationshipResponseDto, relationship, {
            excludeExtraneousValues: true
        });
    }
    static toRelationshipResponseDtoList(relationships) {
        return (0, _classtransformer.plainToInstance)(_relationshipResponsedto.RelationshipResponseDto, relationships, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=relationships.mapper.js.map