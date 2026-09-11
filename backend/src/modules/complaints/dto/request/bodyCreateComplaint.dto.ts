import { IsString } from 'class-validator';

export class BodyCreateComplaintDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;
}
