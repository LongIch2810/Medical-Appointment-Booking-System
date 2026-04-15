import Article from 'src/entities/article.entity';
import { ArticleResponseDto } from './dto/response/articleResponse.dto';
import { plainToInstance } from 'class-transformer';
import ArticleTag from 'src/entities/articleTag.entity';

export class ArticleMapper {
  static toArticleResponseDto(article: Article): ArticleResponseDto {
    return plainToInstance(
      ArticleResponseDto,
      {
        ...article,
        tags: article.tags?.map((articleTag: ArticleTag) => articleTag.tag),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  static toArticleResponseDtoList(articles: Article[]): ArticleResponseDto[] {
    return plainToInstance(
      ArticleResponseDto,
      articles.map((article) => this.toArticleResponseDto(article)),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
