import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { RelationshipResponseDto } from 'src/modules/relationships/dto/response/relationshipResponse.dto';
import { UserResponseDto } from 'src/modules/users/dto/response/userResponse.dto';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class RelativeResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  @Type(() => RelationshipResponseDto)
  relationship!: RelationshipResponseDto;

  @Expose()
  phone!: string;

  @Expose()
  dob!: Date;

  @Expose()
  gender!: boolean;

  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
