"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PermissionsMapper", {
    enumerable: true,
    get: function() {
        return PermissionsMapper;
    }
});
const _permissionResponsedto = require("./dto/response/permissionResponse.dto");
const _classtransformer = require("class-transformer");
let PermissionsMapper = class PermissionsMapper {
    static toPermissionResponseDto(permission) {
        return (0, _classtransformer.plainToInstance)(_permissionResponsedto.PermissionResponseDto, permission, {
            excludeExtraneousValues: true
        });
    }
    static toPermissionResponseDtoList(permissions) {
        return (0, _classtransformer.plainToInstance)(_permissionResponsedto.PermissionResponseDto, permissions, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=permissions.mapper.js.map