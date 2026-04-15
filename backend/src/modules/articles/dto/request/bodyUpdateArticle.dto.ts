import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class BodyUpdateArticleDto {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  img_url!: string;

  @IsString()
  @Length(1, 500)
  summary!: string;
}
