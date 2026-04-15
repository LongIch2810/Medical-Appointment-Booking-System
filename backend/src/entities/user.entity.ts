import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';

import UserRole from './userRole.entity';
import Notification from './notification.entity';
import Article from './article.entity';
import Doctor from './doctor.entity';
import Appointment from './appointment.entity';
import Conversation from './conversation.entity';
import Otp from './otp.entity';
import Message from './message.entity';
import ChannelMembers from './channelMembers.entity';
import Relative from './relative.entity';
import { AuditLog } from './auditLog.entity';

@Entity('users')
export default class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: true })
  password!: string | null;

  @Column({ unique: true, nullable: true })
  phone!: string | null;

  @Column({ nullable: true })
  fullname!: string | null;

  @Column({ default: true })
  gender!: boolean;

  @Column({ nullable: true })
  date_of_birth!: Date | null;

  @Column({ nullable: true })
  picture!: string | null;

  @Column({ nullable: true })
  address!: string | null;

  @Column({ default: false })
  isAdmin!: boolean;

  @OneToMany(() => UserRole, (ur) => ur.user)
  roles!: Relation<UserRole[]>;

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Relation<Notification[]>;

  @OneToMany(() => Article, (a) => a.author)
  articles!: Relation<Article[]>;

  @OneToOne(() => Doctor, (d) => d.user)
  doctor!: Relation<Doctor>;

  @OneToMany(() => Conversation, (c) => c.user)
  messages!: Relation<Conversation[]>;

  @OneToMany(() => Otp, (o) => o.user)
  otps!: Relation<Otp[]>;

  @OneToMany(() => Message, (m) => m.sender)
  chat_messages!: Relation<Message[]>;

  @OneToMany(() => ChannelMembers, (cm) => cm.user)
  channels!: Relation<ChannelMembers[]>;

  @OneToMany(() => Relative, (r) => r.user)
  relatives!: Relation<Relative[]>;

  @OneToMany(() => Appointment, (a) => a.booked_by_user)
  appointments!: Relation<Appointment[]>;

  @OneToMany(() => AuditLog, (al) => al.user)
  auditLogs!: Relation<AuditLog[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
