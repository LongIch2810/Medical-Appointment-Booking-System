import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BodyUpdateHealthProfileDto {
  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Nhóm máu
  blood_type?: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Bệnh nền
  medical_history?: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Dị ứng
  allergies?: string;

  @IsNumber()
  @IsOptional()
  //Nhịp tim
  heart_rate?: number;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Huyết áp
  blood_pressure?: string;

  @IsNumber()
  @IsOptional()
  //Lượng đường huyết (mg/dL)
  glucose_level?: number;

  @IsNumber()
  @IsOptional()
  //Mức cholesterol (mg/dL)
  cholesterol_level?: number;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Thuốc đang sử dụng
  medications?: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Các mũi vac xin đã tiêm
  vaccinations?: string;

  @IsBoolean()
  @IsOptional()
  //Có hút thuốc không ?
  smoking?: boolean;

  @IsBoolean()
  @IsOptional()
  //Có uống rượu hoặc bia không
  alcohol_consumption?: boolean;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  //Tần suất vận động
  exercise_frequency?: string;

  @IsDateString()
  @IsOptional()
  //Ngày khám gần nhất
  last_checkup_date?: Date;
}
