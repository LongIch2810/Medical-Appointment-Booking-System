import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import ExaminationResult from './examinationResult.entity';
import SatisfactionRating from './satisfactionRating.entity';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import DoctorSchedule from './doctorSchedule.entity';
import { BookingMode } from 'src/shared/enums/bookingMode';
import Relative from './relative.entity';
import User from './user.entity';

@Entity('appointments')
// @Unique('unique_doctor_schedule_date', [
//   'doctor_schedule_id',
//   'appointment_date',
// ])
// @Index('unique_doctor_schedule_date', ['doctorSchedule', 'appointmentDate'], {
//   unique: true,
//   where: `"status" IN ('PENDING', 'CONFIRMED') AND "deleted_at" IS NULL`,
// })
export default class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date', nullable: false })
  appointment_date!: Date;

  @Column({
    type: 'enum',
    default: AppointmentStatus.PENDING,
    enumName: 'appointment_status',
    enum: AppointmentStatus,
  })
  status!: AppointmentStatus;

  @Column({
    type: 'enum',
    default: BookingMode.USER_SELECT,
    enumName: 'booking_mode',
    enum: BookingMode,
  })
  booking_mode!: BookingMode;

  @ManyToOne(() => DoctorSchedule, (ds) => ds.appointments, { nullable: false })
  @JoinColumn({ name: 'doctor_schedule_id' })
  doctor_schedule!: Relation<DoctorSchedule>;

  @ManyToOne(() => Relative, (r) => r.appointments, { nullable: false })
  @JoinColumn({ name: 'patient_id' })
  patient!: Relation<Relative>;

  @OneToOne(() => ExaminationResult, (er) => er.appointment, {
    nullable: true,
  })
  examination_result!: Relation<ExaminationResult>;

  @OneToOne(() => SatisfactionRating, (sr) => sr.appointment, {
    nullable: true,
  })
  satisfaction_rating!: Relation<SatisfactionRating>;

  @ManyToOne(() => User, (u) => u.appointments, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  booked_by_user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
