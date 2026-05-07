import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import Message from './message.entity';
import { FileType } from '../shared/enums/FileType';

@Entity('messages_attachments')
export default class MessageAttachments {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Message, (m) => m.message_attachments)
  @JoinColumn({ name: 'message_id' })
  message!: Relation<Message>;

  @Column({ type: 'text', nullable: true })
  url!: string | null;

  @Column({
    type: 'enum',
    default: FileType.IMAGE,
    enumName: 'file_type',
    enum: FileType,
  })
  type!: FileType;

  @Column({ type: 'text', nullable: false })
  file_name!: string;

  @Column({ type: 'int', nullable: false })
  file_size!: number;

  @Column({ type: 'text', nullable: false })
  file_extension!: string;

  @Column({ type: 'text', nullable: false, unique: true })
  public_id!: string;
}
