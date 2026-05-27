import { plainToInstance } from 'class-transformer';
import { RolePermissionMatrixResponseDto } from './dto/response/rolePermissionMatrixResponse.dto';

export class RolePermissionMapper {
  static toMatrixResponseDto(
    payload: Record<string, unknown>,
  ): RolePermissionMatrixResponseDto {
    return plainToInstance(RolePermissionMatrixResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }
}
