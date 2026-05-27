"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RolesMapper", {
    enumerable: true,
    get: function() {
        return RolesMapper;
    }
});
const _roleResponsedto = require("./dto/response/roleResponse.dto");
const _classtransformer = require("class-transformer");
let RolesMapper = class RolesMapper {
    static toRoleResponseDto(role) {
        return (0, _classtransformer.plainToInstance)(_roleResponsedto.RoleResponseDto, {
            ...role,
            permissions: role.permissions.map((rp)=>rp.permission)
        }, {
            excludeExtraneousValues: true
        });
    }
    static toRoleResponseDtoList(roles) {
        return (0, _classtransformer.plainToInstance)(_roleResponsedto.RoleResponseDto, roles.map((role)=>{
            return {
                ...role,
                permissions: role.permissions.map((rp)=>rp.permission)
            };
        }), {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=roles.mapper.js.map