import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import Doctor from './doctor.entity';

@Entity('specialties')
export default class Specialty {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  name!: string;

  @Column({ unique: true, nullable: false })
  slug!: string;

  @Column({ nullable: false })
  description!: string;

  @Column({ nullable: false })
  img_url!: string;

  @OneToMany(() => Doctor, (d) => d.specialty)
  doctors!: Relation<Doctor[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
