import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import Topic from './topic.entity';
import ArticleTag from './articleTag.entity';
import User from './user.entity';
import { ImageInfo } from 'src/shared/interfaces/imageInfo';

@Entity('articles')
export default class Article {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: false })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  img_urls!: ImageInfo[];

  @Column({ nullable: false })
  summary!: string;

  @Column({ unique: true, nullable: false })
  slug!: string;

  @Column({ default: false })
  is_approve!: boolean;

  @ManyToOne(() => Topic, (t) => t.articles, { nullable: false })
  @JoinColumn({ name: 'topic_id' })
  topic!: Relation<Topic>;

  @OneToMany(() => ArticleTag, (at) => at.article)
  tags!: Relation<ArticleTag[]>;

  @ManyToOne(() => User, (u) => u.articles, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
