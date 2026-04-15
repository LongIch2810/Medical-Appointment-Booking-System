import { MessageType } from 'src/shared/enums/messageType';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import User from './user.entity';
import Channel from './channel.entity';
import MessageAttachments from './messageAttachments.entity';

@Entity('messages')
export default class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    nullable: false,
    enumName: 'message_type',
    enum: MessageType,
  })
  message_type!: MessageType;

  @Column({ nullable: true })
  content!: string | null;

  @Column({ default: false })
  is_read!: boolean;

  @OneToMany(() => MessageAttachments, (ma) => ma.message)
  message_attachments!: Relation<MessageAttachments[]>;

  @ManyToOne(() => User, (u) => u.chat_messages, { nullable: false })
  @JoinColumn({ name: 'sender_id' })
  sender!: Relation<User>;

  @ManyToOne(() => Channel, (c) => c.chat_messages)
  @JoinColumn({ name: 'channel_id' })
  channel!: Relation<Channel>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
