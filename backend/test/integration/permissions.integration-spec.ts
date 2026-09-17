import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { DataSource } from 'typeorm';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerAndPromote,
  registerNewUser,
} from '../fixtures/auth.fixture';
import { ROLE_NAME } from 'src/utils/constants';

describe('PermissionsGuard end-to-end (integration)', () => {
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

  it('rejects any request without an access token cookie', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/role-permission/matrix',
    );
    expect(response.status).toBe(401);
  });

  describe('GET /role-permission/matrix (role-permission:read)', () => {
    it('is forbidden for a plain PATIENT account', async () => {
      const patient = await registerNewUser(app, dataSource);
      createdUserIds.push(patient.userId);
      const { cookieHeader } = await loginAs(app, patient);

      const response = await request(app.getHttpServer())
        .get('/api/v1/role-permission/matrix')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'patient');

      expect(response.status).toBe(403);
      expect(response.body.error.details).toEqual(
        expect.stringContaining('Bạn không có quyền truy cập'),
      );
    });

    it('is allowed for an ADMIN account and returns the real seeded roles', async () => {
      const admin = await registerAndPromote(app, dataSource, ROLE_NAME.ADMIN);
      createdUserIds.push(admin.userId);
      const { cookieHeader } = await loginAs(
        app,
        admin,
        '/api/v1/auth/admin/login',
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/role-permission/matrix')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'admin');

      expect(response.status).toBe(200);
      const roleNames = response.body.data.roles.map(
        (role: { role_name: string }) => role.role_name,
      );
      expect(roleNames).toEqual(
        expect.arrayContaining([
          ROLE_NAME.ADMIN,
          ROLE_NAME.DOCTOR,
          ROLE_NAME.PATIENT,
        ]),
      );
    });
  });

  describe('POST /permissions (permission:read) — a second, independent guarded route', () => {
    it('is forbidden for a plain PATIENT account', async () => {
      const patient = await registerNewUser(app, dataSource);
      createdUserIds.push(patient.userId);
      const { cookieHeader } = await loginAs(app, patient);

      const response = await request(app.getHttpServer())
        .post('/api/v1/permissions')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'patient')
        .send({ page: 1, limit: 10, arrange: 'desc' });

      expect(response.status).toBe(403);
    });

    it('is allowed for an ADMIN account', async () => {
      const admin = await registerAndPromote(app, dataSource, ROLE_NAME.ADMIN);
      createdUserIds.push(admin.userId);
      const { cookieHeader } = await loginAs(
        app,
        admin,
        '/api/v1/auth/admin/login',
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/permissions')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'admin')
        .send({ page: 1, limit: 10, arrange: 'desc' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });
  });
});
