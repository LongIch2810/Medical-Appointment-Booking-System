import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.entity';
import Relative from './relative.entity';
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';

@Entity('ai_health_roadmaps')
@Index('IDX_ai_health_roadmaps_user_created_at', ['user', 'created_at'])
@Index('IDX_ai_health_roadmaps_relative_created_at', ['relative', 'created_at'])
export default class AiHealthRoadmap {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.ai_health_roadmaps, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @ManyToOne(() => Relative, (relative) => relative.ai_health_roadmaps, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'relative_id' })
  relative!: Relation<Relative>;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'jsonb' })
  output_asset!: AiDocumentAsset;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date | null;
}
