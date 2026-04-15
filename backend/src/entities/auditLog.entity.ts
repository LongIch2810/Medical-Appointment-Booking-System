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

  @Column({ nullable: false })
  action!: string;

  @Column({ nullable: false })
  entity_type!: string;

  @Column({ type: 'jsonb', nullable: true })
  old_data!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_data!: Record<string, any>;

  @Column({ nullable: false })
  endpoint!: string;

  @Column({ nullable: false })
  method!: string;

  @Column({ nullable: false })
  status_code!: number;

  @Column({ default: false })
  is_success!: boolean;

  @Column({ nullable: true })
  error_message!: string;

  @ManyToOne(() => User, (u) => u.auditLogs, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
