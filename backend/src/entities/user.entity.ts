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
import { UserSetting } from './userSetting.entity';
import Complaint from './complaint.entity';
import AiAdminReport from './aiAdminReport.entity';
import AiHealthRoadmap from './aiHealthRoadmap.entity';
import AiReportConversation from './aiReportConversation.entity';
import PatientChatConversation from './patientChatConversation.entity';

@Entity('users')
export default class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true, nullable: false })
  username!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', nullable: true })
  password!: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: false })
  fullname!: string;

  @Column({ type: 'boolean', default: true })
  gender!: boolean;

  @Column({ type: 'date', nullable: true })
  date_of_birth!: Date | null;

  @Column({ type: 'text', nullable: true })
  picture!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_locking!: boolean;

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

  @OneToMany(() => Complaint, (complaint) => complaint.user)
  complaints!: Relation<Complaint[]>;

  @OneToOne(() => UserSetting, (us) => us.user)
  user_setting!: Relation<UserSetting>;

  @OneToMany(() => AiAdminReport, (report) => report.createdBy)
  ai_admin_reports!: Relation<AiAdminReport[]>;

  @OneToMany(
    () => AiReportConversation,
    (conversation) => conversation.createdBy,
  )
  ai_report_conversations!: Relation<AiReportConversation[]>;

  @OneToMany(() => PatientChatConversation, (conversation) => conversation.user)
  patient_chat_conversations!: Relation<PatientChatConversation[]>;

  @OneToMany(() => AiHealthRoadmap, (roadmap) => roadmap.user)
  ai_health_roadmaps!: Relation<AiHealthRoadmap[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
