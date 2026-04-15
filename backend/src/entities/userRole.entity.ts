import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
  Unique,
} from 'typeorm';
import User from './user.entity';
import Role from './role.entity';

@Entity('user_roles')
@Unique('UQ_user_roles', ['user', 'role'])
export default class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Relation<Role>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
