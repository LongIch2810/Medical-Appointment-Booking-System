import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mail/mail.service';
import { jobEmailName } from 'src/shared/enums/jobEmailName';

@Processor('email-queue', {
  concurrency: 20,
})
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const jobName = job.name as jobEmailName;
    if (jobName === jobEmailName.OTP) {
      const { email, otp, username } = job.data;

      console.log(`Gửi OTP đến ${email} - Lần thử: ${job.attemptsMade + 1}`);

      await this.mailService.sendOtpEmail(email, otp, username);
    } else if (jobName === jobEmailName.WELCOME) {
      const { email, username } = job.data;

      console.log(
        `Gửi lời chào đến ${email} - Lần thử: ${job.attemptsMade + 1}`,
      );

      await this.mailService.sendWelcomeEmail(email, username);
    } else if (jobName === jobEmailName.APPOINTMENT) {
      const { email, recipientName, subject, content } = job.data;
      await this.mailService.sendAppointmentEmail(
        email,
        recipientName,
        subject,
        content,
      );
    }
  }
}
