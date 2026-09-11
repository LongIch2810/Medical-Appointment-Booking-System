import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { jobEmailName } from 'src/shared/enums/jobEmailName';

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue('email-queue') private readonly queue: Queue) {}

  async sendOtp(email: string, otp: string, username: string) {
    await this.queue.add(
      jobEmailName.OTP,
      { email, otp, username },
      {
        attempts: 3, //Thử lại 3 lần,
        backoff: { type: 'exponential', delay: 2000 }, //Khoảng nghỉ trước khi retry khi job thất bại
        delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
        removeOnFail: false, // Xóa khi gặp lỗi
      },
    );
  }

  async sendWelcome(email: string, username: string) {
    await this.queue.add(
      jobEmailName.WELCOME,
      { email, username },
      {
        attempts: 3, //Thử lại 3 lần,
        backoff: { type: 'exponential', delay: 2000 }, //Khoảng nghỉ trước khi retry khi job thất bại
        delay: 2000, //Khi add job vào thì sau 2 giây mới bắt đầu chạy lần đầu tiên
        removeOnFail: false, // Xóa khi gặp lỗi
      },
    );
  }

  async sendAppointment(params: {
    notificationId: number;
    email: string;
    recipientName: string;
    subject: string;
    content: string;
  }) {
    await this.queue.add(jobEmailName.APPOINTMENT, params, {
      jobId: `appointment-notification-${params.notificationId}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
