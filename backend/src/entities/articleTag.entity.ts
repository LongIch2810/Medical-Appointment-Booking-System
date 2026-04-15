import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
  Unique,
} from 'typeorm';
import Article from './article.entity';
import Tag from './tag.entity';

@Entity('article_tags')
@Unique('UQ_article_tags', ['article', 'tag'])
export default class ArticleTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Article, (a) => a.tags)
  @JoinColumn({ name: 'article_id' })
  article!: Relation<Article>;

  @ManyToOne(() => Tag, (t) => t.articles)
  @JoinColumn({ name: 'tag_id' })
  tag!: Relation<Tag>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
