import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class BodyRegisterDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^\S+$/)
  username!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail()
  @Matches(/^\S+$/)
  email!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullname!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @Matches(/^\S+$/)
  password!: string;
}
