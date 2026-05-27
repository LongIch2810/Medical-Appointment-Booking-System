import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BodyUpdateRelationshipDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  relationship_name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  description?: string;
}
