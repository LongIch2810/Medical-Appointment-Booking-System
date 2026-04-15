import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import User from './user.entity';

@Entity('notifications')
export default class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  content!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: false })
  is_notified!: boolean;

  @ManyToOne(() => User, (u) => u.notifications, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
