import { IsString, MinLength } from 'class-validator';

export class QueryDoctorSuggestionsDto {
  @IsString()
  @MinLength(2)
  search!: string;
}
