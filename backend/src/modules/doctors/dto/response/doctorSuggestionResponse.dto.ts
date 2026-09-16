import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DoctorSuggestionResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  picture!: string | null;

  @Expose()
  specialty!: string | null;
}
