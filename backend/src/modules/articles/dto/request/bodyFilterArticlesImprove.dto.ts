import { IsDateString, IsIn, IsNumber, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BodyFilterArticlesDto } from './bodyFilterArticles.dto';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export class BodyFilterArticlesImproveDto extends BodyFilterArticlesDto {
  @Type(() => Number)
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

  @IsDateString()
  @IsOptional()
  @IsBeforeOrEqual('createdTo')
  createdFrom?: string;

  @IsDateString()
  @IsOptional()
  createdTo?: string;
}
