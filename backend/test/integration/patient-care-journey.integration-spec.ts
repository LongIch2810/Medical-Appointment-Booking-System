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
  start.setDate(start.getDate() + 120);
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

describe('Patient care journey (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let schedule: DoctorScheduleRow;
  let doctorCookie: string;
  let relationshipCode: string;
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

    const relationships = await dataSource.query<
      { relationship_code: string }[]
    >(
      `SELECT relationship_code FROM "relationships"
       WHERE relationship_code <> 'ban_than' ORDER BY id LIMIT 1`,
    );
    if (relationships.length === 0) {
      throw new Error('DB test không có relationship cho người thân.');
    }
    relationshipCode = relationships[0].relationship_code;

    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const token = jwtService.sign(
      {
        sub: schedule.doctor_user_id,
        roles: ['DOCTOR'],
        tokenId: randomUUID(),
        sessionVersion: null,
      },
      {
        secret:
          configService.get<string>('ACCESS_TOKEN_SECRET') ?? 'your_secret',
        expiresIn: '15m',
      },
    );
    doctorCookie = `accessToken=${token}`;
  });

  afterEach(async () => {
    if (createdAppointmentIds.length > 0) {
      await dataSource.query(
        `DELETE FROM "notifications"
         WHERE metadata->>'appointmentId' = ANY($1)`,
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
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists relative -> health profile -> booking -> result -> rating through real services and DB', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const patientLogin = await loginAs(app, patient);

    const relativeResponse = await request(app.getHttpServer())
      .post('/api/v1/relatives')
      .set('Cookie', patientLogin.cookieHeader)
      .send({
        fullname: '  Người Thân Integration  ',
        relationship_code: relationshipCode,
        phone: `09${Date.now().toString().slice(-8)}`,
        dob: '1990-05-20',
        gender: true,
      })
      .expect(201);
    const relativeId = relativeResponse.body.data.id as number;
    expect(relativeResponse.body.data.fullname).toBe('Người Thân Integration');

    await request(app.getHttpServer())
      .patch(`/api/v1/health-profiles/update/${relativeId}`)
      .set('Cookie', patientLogin.cookieHeader)
      .send({
        height: 172,
        weight: 68,
        blood_type: 'O+',
        allergies: 'Penicillin',
      })
      .expect(200);

    const profile = await request(app.getHttpServer())
      .get(`/api/v1/health-profiles/${relativeId}`)
      .set('Cookie', patientLogin.cookieHeader)
      .expect(200);
    expect(profile.body.data).toMatchObject({
      height: 172,
      weight: 68,
      blood_type: 'O+',
      allergies: 'Penicillin',
    });

    const booking = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', patientLogin.cookieHeader)
      .send({
        appointment_date: nextDateMatchingDayOfWeek(schedule.day_of_week),
        doctor_schedule_id: schedule.id,
        relative_id: relativeId,
        booking_mode: 'user_select',
      })
      .expect(201);
    const appointmentId = booking.body.data.id as number;
    createdAppointmentIds.push(appointmentId);
    expect(booking.body.data.status).toBe('PENDING');

    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Cookie', doctorCookie)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    await dataSource.query(
      `UPDATE "appointments"
       SET appointment_date = CURRENT_DATE - INTERVAL '1 day'
       WHERE id = $1`,
      [appointmentId],
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Cookie', doctorCookie)
      .send({ status: 'COMPLETED' })
      .expect(200);

    const examination = await request(app.getHttpServer())
      .post('/api/v1/examination-result/create')
      .set('Cookie', doctorCookie)
      .send({
        symptoms: 'Đau họng',
        diagnosis: 'Viêm họng nhẹ',
        treatment: 'Nghỉ ngơi và uống đủ nước',
        prescription: 'Paracetamol khi sốt',
        appointment_id: appointmentId,
      })
      .expect(201);
    expect(examination.body.data.appointment.id).toBe(appointmentId);

    const rating = await request(app.getHttpServer())
      .post('/api/v1/satisfaction-rating/create-rating')
      .set('Cookie', patientLogin.cookieHeader)
      .send({
        rating_score: 5,
        feedback: '  Bác sĩ tư vấn rất rõ ràng  ',
        appointment_id: appointmentId,
      })
      .expect(201);
    expect(rating.body.data).toEqual({ message: 'Đã hoàn thành đánh giá.' });

    const persisted = await dataSource.query<
      {
        status: string;
        diagnosis: string;
        rating_score: number;
        feedback: string;
      }[]
    >(
      `SELECT a.status, er.diagnosis, sr.rating_score, sr.feedback
       FROM "appointments" a
       INNER JOIN "examination_result" er ON er.appointment_id = a.id
       INNER JOIN "satisfaction_rating" sr ON sr.appointment_id = a.id
       WHERE a.id = $1`,
      [appointmentId],
    );
    expect(persisted).toEqual([
      {
        status: 'COMPLETED',
        diagnosis: 'Viêm họng nhẹ',
        rating_score: 5,
        feedback: 'Bác sĩ tư vấn rất rõ ràng',
      },
    ]);
  });
});
