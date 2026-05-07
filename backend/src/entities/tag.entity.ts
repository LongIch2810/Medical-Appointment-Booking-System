import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import ArticleTag from './articleTag.entity';

@Entity('tags')
export default class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false, unique: true })
  name!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  slug!: string;

  @OneToMany(() => ArticleTag, (at) => at.tag)
  articles!: Relation<ArticleTag[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
