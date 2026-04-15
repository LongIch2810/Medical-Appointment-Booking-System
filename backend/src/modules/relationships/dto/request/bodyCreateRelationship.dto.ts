import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BodyCreateRelationshipDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  relationship_code!: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  relationship_name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
