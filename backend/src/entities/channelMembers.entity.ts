import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import User from './user.entity';
import Channel from './channel.entity';

@Entity('channel_members')
@Unique('UQ_channel_members', ['channel', 'user'])
export default class ChannelMembers {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (u) => u.channels)
  @JoinColumn({ name: 'participant_id' })
  user!: Relation<User>;

  @ManyToOne(() => Channel, (c) => c.participants, { nullable: false })
  @JoinColumn({ name: 'channel_id' })
  channel!: Relation<Channel>;
}
