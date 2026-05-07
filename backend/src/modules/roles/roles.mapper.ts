import Role from "src/entities/role.entity";
import { RoleResponseDto } from "./dto/response/roleResponse.dto";
import { plainToInstance } from "class-transformer";

export class RolesMapper {
    static toRoleResponseDto(role: Role): RoleResponseDto {
        return plainToInstance(RoleResponseDto, {
            ...role,
            permissions: role.permissions.map(rp => rp.permission)
        },
            {
                excludeExtraneousValues: true,
            });
    }

    static toRoleResponseDtoList(roles: Role[]): RoleResponseDto[] {
        return plainToInstance(RoleResponseDto, roles.map(role => {
            return {
                ...role,
                permissions: role.permissions.map(rp => rp.permission)
            }
        }), {
            excludeExtraneousValues: true,
        });
    }
}