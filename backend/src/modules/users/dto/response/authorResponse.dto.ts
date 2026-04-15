import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthorResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  email!: string;

  @Expose()
  picture!: string;
}
