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
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';

@Entity('ai_medical_record_summaries')
@Index('IDX_ai_medical_summaries_user_created_at', ['user', 'created_at'])
export default class AiMedicalRecordSummary {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.ai_medical_record_summaries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'varchar', length: 20 })
  input_mode!: string;

  @Column({ type: 'jsonb', default: [] })
  source_assets!: AiDocumentAsset[];

  @Column({ type: 'jsonb' })
  output_asset!: AiDocumentAsset;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date | null;
}
