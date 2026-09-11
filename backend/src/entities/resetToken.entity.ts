import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  CreateDateColumn,
  Relation,
} from 'typeorm';
import User from './user.entity';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';

/**
 * Token ngắn hạn, dùng một lần, chỉ được cấp sau khi verify OTP thành công.
 * set-new-password bắt buộc token này thay vì chỉ dựa vào email.
 */
@Entity('reset_tokens')
export default class ResetToken {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Chỉ lưu hash — token thật (raw) chỉ trả về một lần lúc verify OTP. */
  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string;

  @Column({ type: 'text', default: OtpPurpose.PASSWORD_RESET })
  purpose!: OtpPurpose;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;
}
