import { RoleMessage } from 'src/shared/enums/roleMessage';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import User from './user.entity';

@Entity('conversation')
export default class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    default: RoleMessage.HUMAN,
    enumName: 'role_message',
    enum: RoleMessage,
  })
  role!: RoleMessage;

  @Column({ nullable: false })
  content!: string;

  @ManyToOne(() => User, (u) => u.messages)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
