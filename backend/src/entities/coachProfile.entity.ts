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
import User from './user.entity';

@Entity('coach_profile')
@Check(`"age" IS NULL OR "age" > 0`)
@Check(`"height" IS NULL OR "height" > 0`)
@Check(`"weight" IS NULL OR "weight" > 0`)
export default class CoachProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  // Tên hiển thị của huấn luyện viên AI
  @Column({ type: 'text' })
  display_name!: string;

  // Mục tiêu sức khỏe (Giảm cân, Tăng cơ, Cân bằng dinh dưỡng...)
  @Column({ type: 'text' })
  health_goal!: string;

  // Sở thích (Chạy bộ, Tập yoga, Ăn chay...)
  @Column({ type: 'simple-array', nullable: true })
  preferences!: string[] | null;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ type: 'int', nullable: true })
  weight!: number | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at!: Date;
}
