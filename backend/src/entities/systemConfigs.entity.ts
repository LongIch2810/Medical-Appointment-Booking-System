import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 1440 })
  reminder_appointment_before_minutes: number;

  @Column({ type: 'boolean', default: true })
  appointment_reminders_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  appointment_emails_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  default_realtime_toasts_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  default_email_notifications_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  default_appointment_reminders_enabled: boolean;

  @Column({ type: 'int', default: 60 })
  reminder_update_health_profile_after_minutes: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}
