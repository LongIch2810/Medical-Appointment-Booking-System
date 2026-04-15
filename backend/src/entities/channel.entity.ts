import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import Message from './message.entity';
import ChannelMembers from './channelMembers.entity';

@Entity('channels')
export default class Channel {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Message, (m) => m.channel)
  chat_messages!: Relation<Message[]>;

  @OneToMany(() => ChannelMembers, (cm) => cm.channel)
  participants!: Relation<ChannelMembers[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
