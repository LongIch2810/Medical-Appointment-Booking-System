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

describe('Notifications (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const createdUserIds: number[] = [];
  const createdNotificationIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);
  });

  afterEach(async () => {
    if (createdNotificationIds.length > 0) {
      await dataSource.query('DELETE FROM "notifications" WHERE id = ANY($1)', [
        createdNotificationIds,
      ]);
      createdNotificationIds.length = 0;
    }
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('a fresh PATIENT sees no notifications of their own', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications/me')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient');

    expect(response.status).toBe(200);
    expect(response.body.data.notifications).toEqual([]);
    expect(response.body.data.total).toBe(0);
  });

  it('GET /notifications/recipients is forbidden for a plain PATIENT', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications/recipients')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient');

    expect(response.status).toBe(403);
  });

  it('an ADMIN can manually create a notification that the target PATIENT then sees and marks as read', async () => {
    const admin = await registerAndPromote(app, dataSource, ROLE_NAME.ADMIN);
    createdUserIds.push(admin.userId);
    const { cookieHeader: adminCookie } = await loginAs(
      app,
      admin,
      '/api/v1/auth/admin/login',
    );

    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader: patientCookie } = await loginAs(app, patient);

    // The recipient picker must list the freshly-registered patient (has the
    // default PATIENT role, active, unlocked).
    const recipientsResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications/recipients')
      .query({ search: patient.email })
      .set('Cookie', adminCookie)
      .set('X-App-Context', 'admin');
    expect(recipientsResponse.status).toBe(200);
    expect(
      recipientsResponse.body.data.users.some(
        (u: { id: number }) => u.id === patient.userId,
      ),
    ).toBe(true);

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/notifications/create')
      .set('Cookie', adminCookie)
      .set('X-App-Context', 'admin')
      .send({
        title: 'Integration test notice',
        content: 'This is a test notification.',
        userId: patient.userId,
      });
    expect(createResponse.status).toBe(201);
    const notificationId = createResponse.body.data.id as number;
    createdNotificationIds.push(notificationId);
    expect(createResponse.body.data.isRead).toBe(false);

    const mineResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications/me')
      .set('Cookie', patientCookie)
      .set('X-App-Context', 'patient');
    expect(
      mineResponse.body.data.notifications.some(
        (n: { id: number }) => n.id === notificationId,
      ),
    ).toBe(true);

    const readResponse = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/me/${notificationId}/read`)
      .set('Cookie', patientCookie)
      .set('X-App-Context', 'patient');
    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data.isRead).toBe(true);

    const rows = await dataSource.query<{ is_read: boolean }[]>(
      'SELECT is_read FROM "notifications" WHERE id = $1',
      [notificationId],
    );
    expect(rows[0].is_read).toBe(true);
  });

  it('rejects a manual notification targeting a user with no role', async () => {
    const admin = await registerAndPromote(app, dataSource, ROLE_NAME.ADMIN);
    createdUserIds.push(admin.userId);
    const { cookieHeader: adminCookie } = await loginAs(
      app,
      admin,
      '/api/v1/auth/admin/login',
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications/create')
      .set('Cookie', adminCookie)
      .set('X-App-Context', 'admin')
      .send({
        title: 'Should fail',
        content: 'Target does not exist.',
        userId: 999999999,
      });

    expect(response.status).toBe(404);
  });
});
