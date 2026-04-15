import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class BodyUpdateTopicDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description?: string;
}
