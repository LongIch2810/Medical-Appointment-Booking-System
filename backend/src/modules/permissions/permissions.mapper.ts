import Permission from "src/entities/permission.entity";
import { PermissionResponseDto } from "./dto/response/permissionResponse.dto";
import { plainToInstance } from "class-transformer";

export class PermissionsMapper {
    static toPermissionResponseDto(permission: Permission): PermissionResponseDto {
        return plainToInstance(PermissionResponseDto, permission, {
            excludeExtraneousValues: true,
        });
    }

    static toPermissionResponseDtoList(permissions: Permission[]): PermissionResponseDto[] {
        return plainToInstance(PermissionResponseDto, permissions, {
            excludeExtraneousValues: true,
        });
    }
}