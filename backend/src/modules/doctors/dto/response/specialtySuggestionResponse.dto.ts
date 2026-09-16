import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SpecialtySuggestionResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}
