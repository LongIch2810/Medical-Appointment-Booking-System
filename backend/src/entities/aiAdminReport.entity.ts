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

@Entity('ai_admin_reports')
@Index('IDX_ai_admin_reports_created_by_created_at', [
  'createdBy',
  'created_at',
])
@Index('IDX_ai_admin_reports_report_type_created_at', [
  'report_type',
  'created_at',
])
export default class AiAdminReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.ai_admin_reports, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: Relation<User>;

  @Column({ type: 'varchar', length: 80 })
  report_type!: string;

  @Column({ type: 'varchar', length: 40 })
  range_preset!: string;

  @Column({ type: 'date' })
  from_date!: string;

  @Column({ type: 'date' })
  to_date!: string;

  @Column({ type: 'text' })
  range_label!: string;

  @Column({ type: 'jsonb', nullable: true })
  report!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  chart_config!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', default: [] })
  table_columns!: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  table_rows!: Record<string, string | number>[];

  @Column({ type: 'jsonb' })
  output_asset!: AiDocumentAsset;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date | null;
}
