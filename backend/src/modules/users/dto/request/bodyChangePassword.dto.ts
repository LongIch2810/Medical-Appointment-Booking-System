import { IsString, Min } from 'class-validator';

export class BodyChangePasswordDto {
  @IsString()
  @Min(6)
  old_password: string;
  @IsString()
  @Min(6)
  new_password: string;
}
