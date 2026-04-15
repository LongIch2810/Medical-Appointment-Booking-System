import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PermissionResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}
