import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { BodyFilterArticlesDto } from './bodyFilterArticles.dto';

export class BodyFilterArticlesImproveDto extends BodyFilterArticlesDto {
  @IsNumber()
  @IsOptional()
  author_id?: number;

  @IsOptional()
  @IsIn(['true', 'false', 'all'])
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') return value.toLowerCase();
    return value;
  })
  is_approve?: 'true' | 'false' | 'all';
}
