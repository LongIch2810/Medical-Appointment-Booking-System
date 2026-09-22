import {
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Column,
} from 'typeorm';
import PatientChatConversation from './patientChatConversation.entity';

export type PatientChatMessageRole = 'USER' | 'ASSISTANT';
export type PatientChatAction =
  | 'ANSWER'
  | 'CLARIFY'
  | 'BOOKING_APPROVAL'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'MEMORY_RESULT'
  | 'REFUSE';

@Entity('patient_chat_messages')
@Index('IDX_patient_chat_messages_conversation_id', ['conversation', 'id'])
@Check('CHK_patient_chat_messages_role', `"role" IN ('USER', 'ASSISTANT')`)
export default class PatientChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => PatientChatConversation,
    (conversation) => conversation.messages,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Relation<PatientChatConversation>;

  @Column({ type: 'varchar', length: 16 })
  role!: PatientChatMessageRole;

  @Column({ type: 'varchar', length: 32, nullable: true })
  action!: PatientChatAction | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ type: 'integer', nullable: true, name: 'appointment_id' })
  appointment_id!: number | null;

  @Column({ type: 'uuid', nullable: true, name: 'turn_id' })
  turn_id!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
