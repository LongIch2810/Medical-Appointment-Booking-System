import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDate,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BodyUpdateUserDto {
  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  fullname: string;

  @IsBoolean()
  gender: boolean;

  @Type(() => Date)
  @IsDate()
  date_of_birth: Date;

  @IsString()
  picture: string;

  @IsString()
  address: string;
}
