import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BodyAssignRolePermissionsDto {
  @Type(() => Number)
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @IsOptional()
  permission_ids?: number[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  permission_names?: string[];
}
