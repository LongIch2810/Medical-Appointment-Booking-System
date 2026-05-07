import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';
import User from './user.entity';

@Entity('user_settings')
export class UserSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'boolean', default: true })
    is_notification_email: boolean;

    @Column({ type: 'boolean', default: true })
    is_reminder_appoinments: boolean;

    @OneToOne(() => User, u => u.user_setting, {
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
