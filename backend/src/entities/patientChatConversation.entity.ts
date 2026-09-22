import {
  CreateDateColumn,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.entity';
import PatientChatMessage from './patientChatMessage.entity';

@Entity('patient_chat_conversations')
@Index('IDX_patient_chat_conversations_owner_updated', ['user', 'updated_at'])
export default class PatientChatConversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.patient_chat_conversations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @OneToMany(() => PatientChatMessage, (message) => message.conversation)
  messages!: Relation<PatientChatMessage[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date | null;
}
