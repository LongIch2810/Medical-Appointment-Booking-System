import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import User from './user.entity';
import HealthProfile from './healthProfile.entity';
import Relationship from './relationship.entity';
import Appointment from './appointment.entity';

@Entity('relatives')
export default class Relative {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.relatives, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ nullable: true })
  fullname!: string | null;

  @ManyToOne(() => Relationship, (rel) => rel.relatives, { nullable: false })
  @JoinColumn({
    name: 'relationship_code',
    referencedColumnName: 'relationship_code',
  })
  relationship!: Relation<Relationship>;

  @Column({ nullable: true })
  phone!: string | null;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Column({ default: true })
  gender!: boolean;

  @OneToOne(() => HealthProfile, (hp) => hp.patient)
  health_profile!: Relation<HealthProfile>;

  @OneToMany(() => Appointment, (a) => a.patient)
  appointments!: Relation<Appointment[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
