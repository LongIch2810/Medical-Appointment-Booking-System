import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class BodyBuildHealthRoadmapDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  relative_id!: number;
}
