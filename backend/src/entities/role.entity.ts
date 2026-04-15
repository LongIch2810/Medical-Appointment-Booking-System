import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import UserRole from './userRole.entity';
import RolePermission from './rolePermission.entity';

@Entity('roles')
export default class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    nullable: false,
    unique: true,
  })
  role_name!: string;

  @Column({ nullable: false })
  description!: string;

  @Column({
    unique: true,
    nullable: false,
  })
  role_code!: number;

  @OneToMany(() => UserRole, (ur) => ur.role)
  users!: Relation<UserRole[]>;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  permissions!: Relation<RolePermission[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
