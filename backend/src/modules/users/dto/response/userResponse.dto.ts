import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { RoleResponseDto } from 'src/modules/roles/dto/response/roleResponse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  email!: string;

  @Expose()
  picture!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  date_of_birth!: string;

  @Expose()
  gender!: boolean;

  @Expose()
  address!: string;

  @Expose()
  phone!: string;

  @Expose()
  username!: string;

  @Expose()
  isAdmin!: boolean;

  @Expose()
  @Type(() => RoleResponseDto)
  roles!: RoleResponseDto[];

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
