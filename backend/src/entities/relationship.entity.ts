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
import Relative from './relative.entity';

@Entity('relationships')
export default class Relationship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  relationship_code!: string;

  @Column({ unique: true })
  relationship_name!: string;

  @Column({ nullable: true })
  description!: string | null;

  @OneToMany(() => Relative, (r) => r.relationship)
  relatives!: Relation<Relative[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
