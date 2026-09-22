import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import User from './user.entity';
import AiReportMessage from './aiReportMessage.entity';

@Entity('ai_report_conversations')
@Index('IDX_ai_report_conversations_owner_updated', ['createdBy', 'updated_at'])
export default class AiReportConversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.ai_report_conversations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: Relation<User>;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @OneToMany(() => AiReportMessage, (message) => message.conversation)
  messages!: Relation<AiReportMessage[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date | null;
}
