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
import Article from './article.entity';

@Entity('topics')
export default class Topic {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  slug!: string;

  @OneToMany(() => Article, (a) => a.topic)
  articles!: Relation<Article[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
