import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class BodyCreateTagDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name!: string;
}
