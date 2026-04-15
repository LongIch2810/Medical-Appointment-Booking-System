import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import RolePermission from './rolePermission.entity';

@Entity('permissions')
export default class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  roles!: Relation<RolePermission[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
