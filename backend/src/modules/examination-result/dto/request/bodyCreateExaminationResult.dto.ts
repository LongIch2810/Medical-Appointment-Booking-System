import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BodyCreateExaminationResultDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  symptoms!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  diagnosis!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  treatment!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  prescription!: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  appointment_id!: number;
}
