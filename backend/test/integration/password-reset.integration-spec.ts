import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { DataSource } from 'typeorm';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerNewUser,
} from '../fixtures/auth.fixture';

/**
 * Chứng minh luồng reset password mới (item P0): set-new-password bắt buộc
 * reset token hợp lệ được phát hành SAU KHI verify OTP đúng, token dùng một
 * lần, và không có cách nào chỉ dựa vào email để đổi mật khẩu người khác.
 */
describe('Password reset via OTP + reset token (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailProducer: { sendOtp: jest.Mock };
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);
    emailProducer = app.get(EmailProducer) as unknown as { sendOtp: jest.Mock };
  });

  afterEach(async () => {
    emailProducer.sendOtp.mockClear();
    if (createdUserIds.length > 0) {
      // otps.user_id FK is ON DELETE NO ACTION — must clear these first or
      // the users DELETE below fails with a foreign key violation.
      await dataSource.query(
        'DELETE FROM "reset_tokens" WHERE user_id = ANY($1)',
        [createdUserIds],
      );
      await dataSource.query('DELETE FROM "otps" WHERE user_id = ANY($1)', [
        createdUserIds,
      ]);
    }
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  async function requestOtpAndCapture(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/otps/send-otp')
      .send({ email })
      .expect(200);
    const call = emailProducer.sendOtp.mock.calls.find(
      ([mailTo]) => mailTo === email,
    );
    if (!call) throw new Error(`No OTP email captured for ${email}`);
    return call[1] as string; // (email, otpCode, username)
  }

  it('rejects set-new-password with no token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/set-new-password')
      .send({ newPassword: 'Whatever@123' });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong OTP code and an expired-looking/never-requested OTP', async () => {
    const user = await registerNewUser(app, dataSource);
    createdUserIds.push(user.userId);

    // No OTP was ever requested for this email.
    const noOtp = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode: '000000' });
    expect(noOtp.status).toBe(401);

    await requestOtpAndCapture(user.email);
    const wrongCode = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode: '111111' });
    expect(wrongCode.status).toBe(401);
  });

  it('rejects reusing an already-verified OTP code', async () => {
    const user = await registerNewUser(app, dataSource);
    createdUserIds.push(user.userId);
    const otpCode = await requestOtpAndCapture(user.email);

    await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode })
      .expect(200);

    const reused = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode });
    expect(reused.status).toBe(401);
  });

  it('rejects reusing an already-consumed reset token', async () => {
    const user = await registerNewUser(app, dataSource);
    createdUserIds.push(user.userId);
    const otpCode = await requestOtpAndCapture(user.email);
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode })
      .expect(200);
    const resetToken = verifyResponse.body.data.resetToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/set-new-password')
      .send({ resetToken, newPassword: 'FirstReset@123' })
      .expect(200);

    const secondAttempt = await request(app.getHttpServer())
      .post('/api/v1/auth/set-new-password')
      .send({ resetToken, newPassword: 'SecondReset@123' });
    expect(secondAttempt.status).toBe(401);

    // The password from the first (successful) reset is still the one in effect.
    await loginAs(app, { email: user.email, password: 'FirstReset@123' });
  });

  it("user A's reset token cannot be used to change user B's password, and does not affect B at all", async () => {
    const userA = await registerNewUser(app, dataSource);
    createdUserIds.push(userA.userId);
    const userB = await registerNewUser(app, dataSource);
    createdUserIds.push(userB.userId);

    const otpCodeA = await requestOtpAndCapture(userA.email);
    const verifyA = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: userA.email, otpCode: otpCodeA })
      .expect(200);
    const resetTokenA = verifyA.body.data.resetToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/set-new-password')
      .send({ resetToken: resetTokenA, newPassword: 'NewForA@123' })
      .expect(200);

    // B's original password still works — A's token/reset never touched B.
    await loginAs(app, userB);
    // A's new password works; A's old password no longer does.
    await loginAs(app, { email: userA.email, password: 'NewForA@123' });
    const oldPasswordLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: userA.email, password: userA.password });
    expect(oldPasswordLogin.status).toBe(401);
  });

  it('completes the full happy path and revokes existing sessions after reset', async () => {
    const user = await registerNewUser(app, dataSource);
    createdUserIds.push(user.userId);

    const loginBefore = await loginAs(app, user);

    const otpCode = await requestOtpAndCapture(user.email);
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/otps/verify-otp')
      .send({ email: user.email, otpCode })
      .expect(200);
    expect(verifyResponse.body.data.resetToken).toEqual(expect.any(String));
    const resetToken = verifyResponse.body.data.resetToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/set-new-password')
      .send({ resetToken, newPassword: 'BrandNew@123' })
      .expect(200);

    // The refresh token issued before the reset must now be rejected —
    // password reset revokes existing sessions the same way logout-all does.
    const refreshAfterReset = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', loginBefore.cookieHeader)
      .set('X-App-Context', loginBefore.appContext);
    expect(refreshAfterReset.status).toBe(401);

    await loginAs(app, { email: user.email, password: 'BrandNew@123' });
  });
});
