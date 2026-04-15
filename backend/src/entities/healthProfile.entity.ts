import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
  Check,
} from 'typeorm';
import Relative from './relative.entity';

@Entity('health_profile')
@Check(`"weight" IS NULL OR "weight" > 0`)
@Check(`"height" IS NULL OR "height" > 0`)
@Check(`"heart_rate" IS NULL OR "heart_rate" > 0`)
@Check(`"glucose_level" IS NULL OR "glucose_level" >= 0`)
@Check(`"cholesterol_level" IS NULL OR "cholesterol_level" >= 0`)
export default class HealthProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  weight!: number | null;

  @Column({ nullable: true })
  height!: number | null;

  // Nhóm máu
  @Column({ nullable: true })
  blood_type!: string | null;

  // Bệnh nền
  @Column({ nullable: true })
  medical_history!: string | null;

  // Dị ứng
  @Column({ nullable: true })
  allergies!: string | null;

  // Nhịp tim
  @Column({ nullable: true })
  heart_rate!: number | null;

  // Huyết áp
  @Column({ nullable: true })
  blood_pressure!: string | null;

  // Lượng đường huyết (mg/dL)
  @Column({ nullable: true })
  glucose_level!: number | null;

  // Mức cholesterol (mg/dL)
  @Column({ nullable: true })
  cholesterol_level!: number | null;

  // Thuốc đang sử dụng
  @Column({ nullable: true })
  medications!: string | null;

  // Các mũi vac xin đã tiêm
  @Column({ nullable: true })
  vaccinations!: string | null;

  // Có hút thuốc không ?
  @Column({ nullable: true })
  smoking!: boolean | null;

  // Có uống rượu hoặc bia không
  @Column({ nullable: true })
  alcohol_consumption!: boolean | null;

  // Tần suất vận động
  @Column({ nullable: true })
  exercise_frequency!: string | null;

  // Ngày khám gần nhất
  @Column({ nullable: true })
  last_checkup_date!: Date | null;

  @OneToOne(() => Relative, (r) => r.health_profile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'relative_id' })
  patient!: Relation<Relative>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
