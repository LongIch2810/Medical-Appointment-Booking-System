import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  Relation,
} from 'typeorm';
import User from './user.entity';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';

@Entity('otps')
export default class Otp {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Chỉ lưu bcrypt hash của mã OTP — không bao giờ lưu plaintext. */
  @Column({ name: 'otp_hash', type: 'text' })
  otpHash!: string;

  @Column({ type: 'text', default: OtpPurpose.PASSWORD_RESET })
  purpose!: OtpPurpose;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt!: Date | null;

  @ManyToOne(() => User, (u) => u.otps)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;
}
