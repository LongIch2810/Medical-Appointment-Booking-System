import { jobEmailName } from 'src/shared/enums/jobEmailName';
import { EmailProcessor } from 'src/bullmq/queues/email/email.processor';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';

describe('email queue boundary', () => {
  it('enqueues OTP and welcome jobs with bounded exponential retries', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const producer = new EmailProducer(queue as never);

    await producer.sendOtp('patient@example.com', '123456', 'patient');
    await producer.sendWelcome('patient@example.com', 'patient');

    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      jobEmailName.OTP,
      { email: 'patient@example.com', otp: '123456', username: 'patient' },
      expect.objectContaining({
        attempts: 3,
        delay: 2000,
        removeOnFail: false,
      }),
    );
    expect(queue.add).toHaveBeenNthCalledWith(
      2,
      jobEmailName.WELCOME,
      { email: 'patient@example.com', username: 'patient' },
      expect.objectContaining({ attempts: 3, delay: 2000 }),
    );
  });

  it('uses a stable appointment notification job id for idempotency', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-2' }) };
    const producer = new EmailProducer(queue as never);
    const payload = {
      notificationId: 42,
      email: 'patient@example.com',
      recipientName: 'Patient',
      subject: 'Reminder',
      content: 'Visit tomorrow',
    };

    await producer.sendAppointment(payload);
    expect(queue.add).toHaveBeenCalledWith(
      jobEmailName.APPOINTMENT,
      payload,
      expect.objectContaining({
        jobId: 'appointment-notification-42',
        attempts: 3,
        removeOnComplete: true,
      }),
    );
  });

  it.each([
    [
      jobEmailName.OTP,
      { email: 'p@example.com', otp: '123456', username: 'p' },
      'sendOtpEmail',
      ['p@example.com', '123456', 'p'],
    ],
    [
      jobEmailName.WELCOME,
      { email: 'p@example.com', username: 'p' },
      'sendWelcomeEmail',
      ['p@example.com', 'p'],
    ],
    [
      jobEmailName.APPOINTMENT,
      {
        email: 'p@example.com',
        recipientName: 'P',
        subject: 'S',
        content: 'C',
      },
      'sendAppointmentEmail',
      ['p@example.com', 'P', 'S', 'C'],
    ],
  ])('dispatches %s jobs to MailService', async (name, data, method, args) => {
    const mailService = {
      sendOtpEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendAppointmentEmail: jest.fn(),
    };
    const processor = new EmailProcessor(mailService as never);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await processor.process({ name, data, attemptsMade: 0 } as never);
    expect(
      mailService[method as keyof typeof mailService],
    ).toHaveBeenCalledWith(...args);
  });

  it('ignores unknown job names without sending mail', async () => {
    const mailService = {
      sendOtpEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendAppointmentEmail: jest.fn(),
    };
    await new EmailProcessor(mailService as never).process({
      name: 'unknown',
      data: {},
    } as never);
    expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    expect(mailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(mailService.sendAppointmentEmail).not.toHaveBeenCalled();
  });
});
