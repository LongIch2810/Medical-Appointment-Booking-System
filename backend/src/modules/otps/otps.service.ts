import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import Otp from 'src/entities/otp.entity';
import { LessThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { generateOtpCode } from 'src/utils/generateOtpCode';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { jobEmailName } from 'src/shared/enums/jobEmailName';

@Injectable()
export class OtpsService {
  constructor(
    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    private usersService: UsersService,
    private emailProducer: EmailProducer,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async deleteExpireOtps() {
    const now = new Date();
    const result = await this.otpRepo.delete({
      expiresAt: LessThan(now),
    });
    console.log(`Deleted ${result.affected ?? 0} expired Otps`);
  }

  async sendOtpToEmail(email: string) {
    const userExists = await this.usersService.findByUsernameOrEmail(email);
    if (!userExists) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    let isOtpExits = true;
    let otpCode: string = '';
    while (isOtpExits) {
      otpCode = generateOtpCode();
      const otpExists = await this.otpRepo.findOne({
        where: [{ otpCode }],
      });
      if (!otpExists) isOtpExits = false;
    }

    await this.emailProducer.sendOtp(email, otpCode, userExists.username);

    return { message: 'Đã gửi mã OTP đến gmail của bạn.' };
  }

  async verifyOtp(otpCode: string, email: string) {
    const user = await this.usersService.findByUsernameOrEmail(email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    const otp = await this.otpRepo.findOne({
      where: { otpCode, user: user },
    });

    if (!otp) {
      throw new NotFoundException('Mã OTP không hợp lệ!');
    }

    const now = new Date();
    if (otp.expiresAt < now) {
      throw new NotFoundException('Mã OTP đã hết hạn!');
    }

    otp.verified = true;
    await this.otpRepo.save(otp);

    return { message: 'Xác thực mã OTP thành công.' };
  }
}
