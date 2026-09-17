import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { dayNumberToEnum } from 'src/shared/enums/dayOfWeek';
import {
  assertConnectedToTestDatabase,
  createTestApp,
} from '../setup/test-app.factory';
import {
  cleanupRegisteredUsers,
  loginAs,
  registerNewUser,
} from '../fixtures/auth.fixture';

interface DoctorScheduleRow {
  id: number;
  day_of_week: string;
  doctor_user_id: number;
}

function nextDateMatchingDayOfWeek(targetDayOfWeek: string): string {
  const start = new Date();
  start.setDate(start.getDate() + 150);
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    if (dayNumberToEnum[candidate.getDay()] === targetDayOfWeek) {
      return [
        candidate.getFullYear(),
        String(candidate.getMonth() + 1).padStart(2, '0'),
        String(candidate.getDate()).padStart(2, '0'),
      ].join('-');
    }
  }
  throw new Error(`Không tìm được ngày khớp ${targetDayOfWeek}.`);
}

/**
 * Chứng minh IDOR ở complaints (item 3) và satisfaction-rating (item 3) đã
 * được vá qua toàn bộ pipeline HTTP thật: patient A không thể đọc/list/sửa
 * dữ liệu của patient B, và không thể tạo complaint thay người khác bằng
 * cách truyền userId trong body.
 */
describe('Complaints & satisfaction-rating IDOR (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let schedule: DoctorScheduleRow;
  let doctorCookie: string;
  const createdUserIds: number[] = [];
  const createdAppointmentIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);

    const schedules = await dataSource.query<DoctorScheduleRow[]>(`
      SELECT ds.id, ds.day_of_week, u.id AS doctor_user_id
      FROM "doctor_schedules" ds
      INNER JOIN "doctors" d ON d.id = ds.doctor_id
      INNER JOIN "users" u ON u.id = d.user_id
      WHERE ds.is_active = true
      ORDER BY ds.id
      LIMIT 1
    `);
    if (schedules.length === 0) {
      throw new Error('DB test không có doctor schedule active.');
    }
    schedule = schedules[0];

    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const token = jwtService.sign(
      {
        sub: schedule.doctor_user_id,
        roles: ['DOCTOR'],
        tokenId: randomUUID(),
        sessionVersion: null,
        appContext: 'admin',
      },
      {
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );
    doctorCookie = `adminAccessToken=${token}`;
  });

  afterEach(async () => {
    if (createdAppointmentIds.length > 0) {
      await dataSource.query(
        `DELETE FROM "notifications" WHERE metadata->>'appointmentId' = ANY($1)`,
        [createdAppointmentIds.map(String)],
      );
      await dataSource.query(
        'DELETE FROM "satisfaction_rating" WHERE appointment_id = ANY($1)',
        [createdAppointmentIds],
      );
      await dataSource.query(
        'DELETE FROM "examination_result" WHERE appointment_id = ANY($1)',
        [createdAppointmentIds],
      );
      await dataSource.query('DELETE FROM "appointments" WHERE id = ANY($1)', [
        createdAppointmentIds,
      ]);
      createdAppointmentIds.length = 0;
    }
    await dataSource.query('DELETE FROM "complaints" WHERE user_id = ANY($1)', [
      createdUserIds,
    ]);
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('complaints', () => {
    it("cannot create a complaint as another user, and cannot read/list another user's complaint", async () => {
      const userA = await registerNewUser(app, dataSource);
      createdUserIds.push(userA.userId);
      const loginA = await loginAs(app, userA);

      const userB = await registerNewUser(app, dataSource);
      createdUserIds.push(userB.userId);
      const loginB = await loginAs(app, userB);

      // A tries to file a complaint "as" B by supplying userId in the body.
      const created = await request(app.getHttpServer())
        .post('/api/v1/complaints/create')
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({
          title: 'Spoofed complaint',
          description: 'Should belong to A, not B',
          userId: userB.userId,
        })
        .expect(201);
      expect(created.body.data.user.id).toBe(userA.userId);

      const complaintId = created.body.data.id as number;

      // B (the real owner would be A here) cannot read A's complaint.
      const readByB = await request(app.getHttpServer())
        .get(`/api/v1/complaints/${complaintId}`)
        .set('Cookie', loginB.cookieHeader)
        .set('X-App-Context', 'patient');
      expect(readByB.status).toBe(403);

      // A can read their own complaint.
      const readByA = await request(app.getHttpServer())
        .get(`/api/v1/complaints/${complaintId}`)
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient')
        .expect(200);
      expect(readByA.body.data.id).toBe(complaintId);

      // Neither patient can hit the unscoped global list (admin-only now).
      const globalList = await request(app.getHttpServer())
        .post('/api/v1/complaints')
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({ page: 1, limit: 10, arrange: 'desc' });
      expect(globalList.status).toBe(403);
    });
  });

  describe('satisfaction-rating', () => {
    it("cannot read/update/list another patient's satisfaction rating", async () => {
      const patientB = await registerNewUser(app, dataSource);
      createdUserIds.push(patientB.userId);
      const loginB = await loginAs(app, patientB);

      const patientA = await registerNewUser(app, dataSource);
      createdUserIds.push(patientA.userId);
      const loginA = await loginAs(app, patientA);

      const selfRelative = await dataSource.query<{ id: number }[]>(
        `SELECT id FROM "relatives" WHERE user_id = $1 AND relationship_code = 'ban_than'`,
        [patientB.userId],
      );

      const booking = await request(app.getHttpServer())
        .post('/api/v1/appointments/booking')
        .set('Cookie', loginB.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({
          appointment_date: nextDateMatchingDayOfWeek(schedule.day_of_week),
          doctor_schedule_id: schedule.id,
          relative_id: selfRelative[0].id,
          booking_mode: 'user_select',
        })
        .expect(201);
      const appointmentId = booking.body.data.id as number;
      createdAppointmentIds.push(appointmentId);

      await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}/status`)
        .set('Cookie', doctorCookie)
        .set('X-App-Context', 'admin')
        .send({ status: 'CONFIRMED' })
        .expect(200);

      await dataSource.query(
        `UPDATE "appointments" SET appointment_date = CURRENT_DATE - INTERVAL '1 day' WHERE id = $1`,
        [appointmentId],
      );

      await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}/status`)
        .set('Cookie', doctorCookie)
        .set('X-App-Context', 'admin')
        .send({ status: 'COMPLETED' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/examination-result/create')
        .set('Cookie', doctorCookie)
        .set('X-App-Context', 'admin')
        .send({
          symptoms: 'Sốt nhẹ',
          diagnosis: 'Cảm cúm',
          treatment: 'Nghỉ ngơi',
          prescription: 'Paracetamol',
          appointment_id: appointmentId,
        })
        .expect(201);

      const rating = await request(app.getHttpServer())
        .post('/api/v1/satisfaction-rating/create-rating')
        .set('Cookie', loginB.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({
          rating_score: 5,
          feedback: 'Great',
          appointment_id: appointmentId,
        })
        .expect(201);
      void rating;

      const ratingRow = await dataSource.query<{ id: number }[]>(
        'SELECT id FROM "satisfaction_rating" WHERE appointment_id = $1',
        [appointmentId],
      );
      const ratingId = ratingRow[0].id;

      // A cannot read B's rating.
      const readByA = await request(app.getHttpServer())
        .get(`/api/v1/satisfaction-rating/${ratingId}`)
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient');
      expect(readByA.status).toBe(403);

      // A cannot update B's rating.
      const updateByA = await request(app.getHttpServer())
        .patch(`/api/v1/satisfaction-rating/${ratingId}`)
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({ rating_score: 1, feedback: 'Tampered' });
      expect(updateByA.status).toBe(403);

      // The rating is unchanged after the rejected update attempt.
      const afterAttempt = await dataSource.query<
        { rating_score: number; feedback: string }[]
      >(
        'SELECT rating_score, feedback FROM "satisfaction_rating" WHERE id = $1',
        [ratingId],
      );
      expect(afterAttempt[0]).toEqual({ rating_score: 5, feedback: 'Great' });

      // B (the owner) can still read and update their own rating.
      await request(app.getHttpServer())
        .get(`/api/v1/satisfaction-rating/${ratingId}`)
        .set('Cookie', loginB.cookieHeader)
        .set('X-App-Context', 'patient')
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/satisfaction-rating/${ratingId}`)
        .set('Cookie', loginB.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({ feedback: 'Updated by owner' })
        .expect(200);

      // Neither patient can hit the unscoped global list (admin-only now).
      const globalList = await request(app.getHttpServer())
        .post('/api/v1/satisfaction-rating')
        .set('Cookie', loginA.cookieHeader)
        .set('X-App-Context', 'patient')
        .send({ page: 1, limit: 10, arrange: 'desc' });
      expect(globalList.status).toBe(403);
    });
  });
});
