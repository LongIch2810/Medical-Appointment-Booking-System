import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.entity';
import { UserTheme } from 'src/shared/enums/userTheme';

@Entity('user_settings')
export class UserSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: true })
  email_notifications_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  appointment_reminders_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  realtime_toasts_enabled: boolean;

  @Column({ type: 'varchar', default: UserTheme.SYSTEM })
  theme: UserTheme;

  @OneToOne(() => User, (u) => u.user_setting, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
