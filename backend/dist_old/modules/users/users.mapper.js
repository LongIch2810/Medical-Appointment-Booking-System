"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersMapper", {
    enumerable: true,
    get: function() {
        return UsersMapper;
    }
});
const _classtransformer = require("class-transformer");
const _userResponsedto = require("./dto/response/userResponse.dto");
let UsersMapper = class UsersMapper {
    static toUserProfileResponse(user) {
        return (0, _classtransformer.plainToInstance)(_userResponsedto.UserResponseDto, {
            ...user,
            roles: (user.roles ?? []).map((userRole)=>({
                    role_name: userRole.role.role_name,
                    permissions: (userRole.role.permissions ?? []).map((rolePermission)=>rolePermission.permission)
                }))
        }, {
            excludeExtraneousValues: true
        });
    }
    static toUserListResponse(users) {
        return (0, _classtransformer.plainToInstance)(_userResponsedto.UserResponseDto, users.map((user)=>({
                ...user,
                roles: (user.roles ?? []).map((userRole)=>userRole.role)
            })), {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=users.mapper.js.map