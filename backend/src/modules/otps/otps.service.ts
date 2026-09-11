import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import Otp from 'src/entities/otp.entity';
import ResetToken from 'src/entities/resetToken.entity';
import { IsNull, LessThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { generateOtpCode } from 'src/utils/generateOtpCode';
import {
  generateRawToken,
  hashSecret,
  safeCompareHash,
} from 'src/utils/hashSecret';
import { OtpPurpose } from 'src/shared/enums/otpPurpose';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';

const OTP_EXPIRE_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRE_MS = 10 * 60 * 1000;
const GENERIC_OTP_ERROR = 'Mã OTP không hợp lệ hoặc đã hết hạn.';

@Injectable()
export class OtpsService {
  constructor(
    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    @InjectRepository(ResetToken)
    private resetTokenRepo: Repository<ResetToken>,
    private usersService: UsersService,
    private emailProducer: EmailProducer,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async deleteExpireOtps() {
    const now = new Date();
    const otpResult = await this.otpRepo.delete({
      expiresAt: LessThan(now),
    });
    const tokenResult = await this.resetTokenRepo.delete({
      expiresAt: LessThan(now),
    });
    console.log(
      `Deleted ${otpResult.affected ?? 0} expired Otps, ${tokenResult.affected ?? 0} expired reset tokens`,
    );
  }

  /**
   * Luôn trả về cùng một message chung — không lộ thông tin email có tồn
   * tại trong hệ thống hay không (chống user enumeration). Chỉ thực sự gửi
   * mail nếu user tồn tại.
   */
  async sendOtpToEmail(email: string) {
    const user = await this.usersService.findByUsernameOrEmail(email);

    if (user) {
      // Vô hiệu hóa mọi OTP PASSWORD_RESET cũ chưa dùng của user này —
      // tránh một OTP cũ còn hiệu lực song song với OTP mới nhất.
      await this.otpRepo.update(
        {
          user: { id: user.id },
          purpose: OtpPurpose.PASSWORD_RESET,
          consumedAt: IsNull(),
        },
        { consumedAt: new Date() },
      );

      const otpCode = generateOtpCode();
      const otp = this.otpRepo.create({
        otpHash: hashSecret(otpCode),
        purpose: OtpPurpose.PASSWORD_RESET,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_EXPIRE_MS),
        user: { id: user.id } as never,
      });
      await this.otpRepo.save(otp);

      await this.emailProducer.sendOtp(email, otpCode, user.username);
    }

    return { message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.' };
  }

  /**
   * Verify OTP: kiểm tra hash, expiry, purpose, attempts và trạng thái đã
   * dùng. Thành công thì phát hành reset token ngẫu nhiên, ngắn hạn, dùng
   * một lần — set-new-password bắt buộc token này thay vì chỉ dựa vào
   * email.
   */
  async verifyOtp(
    otpCode: string,
    email: string,
  ): Promise<{ message: string; resetToken: string }> {
    const user = await this.usersService.findByUsernameOrEmail(email);
    // Không phân biệt "user không tồn tại" với "OTP sai" trong response —
    // cùng một lỗi chung để tránh lộ email có tồn tại hay không.
    if (!user) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    const otp = await this.otpRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: OtpPurpose.PASSWORD_RESET,
        consumedAt: IsNull(),
      },
      order: { id: 'DESC' },
    });

    if (!otp) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    const isMatch = safeCompareHash(otp.otpHash, hashSecret(otpCode));
    if (!isMatch) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      throw new UnauthorizedException(GENERIC_OTP_ERROR);
    }

    otp.consumedAt = new Date();
    await this.otpRepo.save(otp);

    const rawToken = generateRawToken();
    const resetToken = this.resetTokenRepo.create({
      tokenHash: hashSecret(rawToken),
      purpose: OtpPurpose.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRE_MS),
      user: { id: user.id } as never,
    });
    await this.resetTokenRepo.save(resetToken);

    return { message: 'Xác thực mã OTP thành công.', resetToken: rawToken };
  }
}
