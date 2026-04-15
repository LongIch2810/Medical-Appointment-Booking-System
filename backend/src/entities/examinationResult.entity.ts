import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import Appointment from './appointment.entity';

@Entity('examination_result')
export default class ExaminationResult {
  @PrimaryGeneratedColumn()
  id!: number;

  // các triệu chứng
  @Column({ nullable: false })
  symptoms!: string;

  // chuẩn đoán
  @Column({ nullable: false })
  diagnosis!: string;

  // Hướng dẫn điều trị
  @Column({ nullable: false })
  treatment!: string;

  // đơn thuốc
  @Column({ nullable: false })
  prescription!: string;

  @OneToOne(() => Appointment, (a) => a.examination_result, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Relation<Appointment>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
