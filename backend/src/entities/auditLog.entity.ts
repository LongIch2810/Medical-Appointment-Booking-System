import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false })
  action!: string;

  @Column({ type: 'text', nullable: false })
  entity_type!: string;

  @Column({ type: 'jsonb', nullable: true })
  old_data!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_data!: Record<string, any>;

  @Column({ type: 'text', nullable: false })
  endpoint!: string;

  @Column({ type: 'text', nullable: false })
  method!: string;

  @Column({ type: 'int', nullable: false })
  status_code!: number;

  @Column({ type: 'boolean', default: false })
  is_success!: boolean;

  @Column({ type: 'text', nullable: true })
  error_message!: string;

  @Column({ type: 'text', nullable: true })
  ip_address!: string;

  @Column({ type: 'text', nullable: true })
  user_agent!: string;

  @Column({ type: 'int', nullable: true })
  duration_ms!: number;

  @ManyToOne(() => User, (u) => u.auditLogs, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
