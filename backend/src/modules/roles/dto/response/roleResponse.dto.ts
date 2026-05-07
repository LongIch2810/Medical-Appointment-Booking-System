import { Exclude, Expose, Type } from 'class-transformer';
import { PermissionResponseDto } from 'src/modules/permissions/dto/response/permissionResponse.dto';

@Exclude()
export class RoleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  role_name!: string;

  @Expose()
  role_code!: number;

  @Expose()
  @Type(() => PermissionResponseDto)
  permissions!: PermissionResponseDto[];
}
