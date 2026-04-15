import { Exclude, Expose, Type } from 'class-transformer';
import { PermissionResponseDto } from 'src/modules/permissions/dto/response/permissionResponse.dto';

@Exclude()
export class RoleResponseDto {
  @Expose()
  role_name!: string;

  @Expose()
  @Type(() => PermissionResponseDto)
  permissions!: PermissionResponseDto[];
}
