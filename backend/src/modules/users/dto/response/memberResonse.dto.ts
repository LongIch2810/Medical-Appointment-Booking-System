import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MemberResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  picture!: string;
}
