import { PartialType } from '@nestjs/mapped-types';
import { BodyUpdateArticleDto } from './bodyUpdateArticle.dto';

export class PartialUpdateArticleDto extends PartialType(
  BodyUpdateArticleDto,
) {}
