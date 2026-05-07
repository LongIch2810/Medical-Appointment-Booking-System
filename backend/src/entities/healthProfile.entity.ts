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

  @Column({ type: 'int', nullable: true })
  weight!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  // Nhóm máu
  @Column({ type: 'text', nullable: true })
  blood_type!: string | null;

  // Bệnh nền
  @Column({ type: 'text', nullable: true })
  medical_history!: string | null;

  // Dị ứng
  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  // Nhịp tim
  @Column({ type: 'int', nullable: true })
  heart_rate!: number | null;

  // Huyết áp
  @Column({ type: 'text', nullable: true })
  blood_pressure!: string | null;

  // Lượng đường huyết (mg/dL)
  @Column({ type: 'int', nullable: true })
  glucose_level!: number | null;

  // Mức cholesterol (mg/dL)
  @Column({ type: 'int', nullable: true })
  cholesterol_level!: number | null;

  // Thuốc đang sử dụng
  @Column({ type: 'text', nullable: true })
  medications!: string | null;

  // Các mũi vac xin đã tiêm
  @Column({ type: 'text', nullable: true })
  vaccinations!: string | null;

  // Có hút thuốc không ?
  @Column({ type: 'boolean', nullable: true })
  smoking!: boolean | null;

  // Có uống rượu hoặc bia không
  @Column({ type: 'boolean', nullable: true })
  alcohol_consumption!: boolean | null;

  // Tần suất vận động
  @Column({ type: 'text', nullable: true })
  exercise_frequency!: string | null;

  // Ngày khám gần nhất
  @Column({ type: 'date', nullable: true })
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
