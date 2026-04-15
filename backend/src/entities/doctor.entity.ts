import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import Specialty from './specialty.entity';
import User from './user.entity';
import Appointment from './appointment.entity';
import DoctorSchedule from './doctorSchedule.entity';
import { DoctorLevel } from 'src/shared/enums/doctorLevel';

@Entity('doctors')
export default class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  experience!: number;

  @Column({ nullable: false })
  about_me!: string;

  @Column({ nullable: false })
  workplace!: string;

  @Column({
    type: 'enum',
    enum: DoctorLevel,
    default: DoctorLevel.DK,
    name: 'doctor_level',
  })
  doctor_level!: DoctorLevel;

  @ManyToOne(() => Specialty, (s) => s.doctors)
  @JoinColumn({ name: 'specialty_id' })
  specialty!: Relation<Specialty>;

  @OneToOne(() => User, (u) => u.doctor)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @OneToMany(() => DoctorSchedule, (ds) => ds.doctor)
  doctor_schedules!: Relation<DoctorSchedule[]>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
