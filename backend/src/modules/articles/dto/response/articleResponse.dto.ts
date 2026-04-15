import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { TagArticleResponseDto } from 'src/modules/tags/dto/response/tagArticleResponse.dto';

import { TopicResponseDto } from 'src/modules/topics/dto/response/topicResponse.dto';
import { AuthorResponseDto } from 'src/modules/users/dto/response/authorResponse.dto';
import { ImageInfo } from 'src/shared/interfaces/imageInfo';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';

@Exclude()
export class ArticleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  summary!: string;

  @Expose()
  content!: string;

  @Expose()
  slug!: string;

  @Expose()
  is_approve!: boolean;

  @Expose()
  img_urls!: ImageInfo[];

  @Expose()
  @Type(() => AuthorResponseDto)
  author!: AuthorResponseDto;

  @Expose()
  @Type(() => TopicResponseDto)
  topic!: TopicResponseDto;

  @Expose()
  @Type(() => TagArticleResponseDto)
  tags!: TagArticleResponseDto[];

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: Date;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: Date;
}
