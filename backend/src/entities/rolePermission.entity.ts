import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  Unique,
} from 'typeorm';
import Role from './role.entity';
import Permission from './permission.entity';

@Entity('role_permissions')
@Unique('UQ_role_permissions', ['role', 'permission'])
export default class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, (r) => r.permissions, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role!: Relation<Role>;

  @ManyToOne(() => Permission, (p) => p.roles)
  @JoinColumn({ name: 'permission_id' })
  permission!: Relation<Permission>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
