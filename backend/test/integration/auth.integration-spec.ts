import { INestApplication } from '@nestjs/common';
// require(): xem giải thích trong test-app.factory.ts (esModuleInterop khác
// nhau giữa ts-jest và SWC khiến default-import ra undefined).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { DataSource } from 'typeorm';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  PATIENT_FIXTURE,
  cleanupRegisteredUsers,
  loginAs,
  registerAndPromote,
  registerNewUser,
} from '../fixtures/auth.fixture';
import { ROLE_NAME } from 'src/utils/constants';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);
  });

  afterEach(async () => {
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates a new PATIENT user with a default profile', async () => {
      const user = await registerNewUser(app, dataSource);
      createdUserIds.push(user.userId);

      const rows = await dataSource.query<{ id: number; is_active: boolean }[]>(
        'SELECT id, is_active FROM "users" WHERE id = $1',
        [user.userId],
      );
      expect(rows).toHaveLength(1);

      const relativeRows = await dataSource.query<{ id: number }[]>(
        'SELECT id FROM "relatives" WHERE user_id = $1',
        [user.userId],
      );
      expect(relativeRows).toHaveLength(1);
    });

    it('rejects a duplicate email with a 409-mapped conflict', async () => {
      const user = await registerNewUser(app, dataSource);
      createdUserIds.push(user.userId);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: `${user.username}_dup`,
          email: user.email,
          password: 'Another@123',
          fullname: 'Duplicate Email User',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('rejects an incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: PATIENT_FIXTURE.email,
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    });

    it('logs in a seeded PATIENT, sets both HttpOnly auth cookies, and does not leak tokens in the body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: PATIENT_FIXTURE.email,
          password: PATIENT_FIXTURE.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('accessToken');
      expect(response.body.data).not.toHaveProperty('refreshToken');
      const setCookie = response.headers['set-cookie'] as unknown as string[];
      const accessCookie = setCookie.find((c) =>
        c.startsWith('patientAccessToken='),
      );
      const refreshCookie = setCookie.find((c) =>
        c.startsWith('patientRefreshToken='),
      );
      expect(accessCookie).toContain('HttpOnly');
      expect(accessCookie).toContain('SameSite=Strict');
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('SameSite=Strict');
      // NODE_ENV=test (not "production") in .env.test, so cookies must not
      // carry Secure — matches the dev/test branch of getAuthCookieOptions.
      expect(accessCookie).not.toContain('Secure');
    });
  });

  describe('POST /auth/admin/login', () => {
    it('rejects a plain PATIENT-only account with 403', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          usernameOrEmail: PATIENT_FIXTURE.email,
          password: PATIENT_FIXTURE.password,
        });

      expect(response.status).toBe(403);
    });

    it('allows a DOCTOR account to log in', async () => {
      const doctorUser = await registerAndPromote(
        app,
        dataSource,
        ROLE_NAME.DOCTOR,
      );
      createdUserIds.push(doctorUser.userId);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          usernameOrEmail: doctorUser.email,
          password: doctorUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('accessToken');
      const setCookie = response.headers['set-cookie'] as unknown as string[];
      expect(setCookie.some((c) => c.startsWith('adminAccessToken='))).toBe(
        true,
      );
    });
  });

  describe('POST /auth/logout and /auth/logout-all', () => {
    it('rejects logout without an authenticated session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(401);
    });

    it('logs a real session out and invalidates its refresh token', async () => {
      const user = await registerNewUser(app, dataSource);
      createdUserIds.push(user.userId);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ usernameOrEmail: user.email, password: user.password })
        .expect(200);
      const cookies = (
        loginResponse.headers['set-cookie'] as unknown as string[]
      )
        .map((c) => c.split(';')[0])
        .join('; ');

      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .set('X-App-Context', 'patient')
        .send();

      expect(logoutResponse.status).toBe(200);

      // The now-blacklisted refresh token must be rejected.
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .set('X-App-Context', 'patient')
        .send();
      expect(refreshResponse.status).toBe(401);
    });

    it('keeps patient and admin sessions independent and rejects context mismatches', async () => {
      const user = await registerAndPromote(app, dataSource, ROLE_NAME.DOCTOR);
      createdUserIds.push(user.userId);

      const adminLogin = await loginAs(app, user, '/api/v1/auth/admin/login');

      // The patient app must remain unauthenticated while only the admin
      // session exists in the browser.
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', adminLogin.cookieHeader)
        .set('X-App-Context', 'patient')
        .expect(401);

      const patientLogin = await loginAs(app, user);
      let adminCookieHeader = adminLogin.cookieHeader;
      let patientCookieHeader = patientLogin.cookieHeader;
      const getBothCookies = () =>
        [adminCookieHeader, patientCookieHeader].join('; ');

      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'admin')
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'patient')
        .expect(200);

      // A patient refresh rotates only the patient session; the admin
      // refresh token remains usable, and vice versa.
      const patientRefreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'patient')
        .expect(200);
      patientCookieHeader = (
        patientRefreshResponse.headers['set-cookie'] as string[]
      )
        .map((cookie) => cookie.split(';')[0])
        .join('; ');

      const adminRefreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'admin')
        .expect(200);
      adminCookieHeader = (
        adminRefreshResponse.headers['set-cookie'] as string[]
      )
        .map((cookie) => cookie.split(';')[0])
        .join('; ');

      // The cookie name and the JWT claim must agree with the request context.
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', adminLogin.cookieHeader)
        .set('X-App-Context', 'patient')
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set(
          'Cookie',
          `patientAccessToken=${adminLogin.accessToken}; patientRefreshToken=${adminLogin.refreshToken}`,
        )
        .set('X-App-Context', 'patient')
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', `accessToken=${adminLogin.accessToken}`)
        .set('X-App-Context', 'admin')
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'patient')
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/users/info')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'admin')
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', getBothCookies())
        .set('X-App-Context', 'admin')
        .expect(200);
    });
  });
});
