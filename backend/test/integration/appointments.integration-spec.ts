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
import { dayNumberToEnum } from 'src/shared/enums/dayOfWeek';

interface DoctorScheduleRow {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

/** Ngày thật kế tiếp (từ hôm nay + 90 ngày trở đi, vượt xa cửa sổ ngày mà
 * seedTransactionalData.ts có thể đã tạo appointment demo) khớp đúng
 * day_of_week của lịch làm việc thật đang dùng để test. */
function nextDateMatchingDayOfWeek(targetDayOfWeek: string): string {
  const start = new Date();
  start.setDate(start.getDate() + 90);
  for (let i = 0; i < 7; i += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    if (dayNumberToEnum[candidate.getDay()] === targetDayOfWeek) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const d = String(candidate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  throw new Error(
    `Không tìm được ngày khớp day_of_week "${targetDayOfWeek}" trong 7 ngày tới.`,
  );
}

describe('Appointments booking flow (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let doctorSchedule: DoctorScheduleRow;
  const createdUserIds: number[] = [];
  const createdAppointmentIds: number[] = [];
  const createdRelativeIds: number[] = [];

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    await assertConnectedToTestDatabase(dataSource);

    const rows = await dataSource.query<DoctorScheduleRow[]>(
      'SELECT id, day_of_week, start_time, end_time FROM "doctor_schedules" WHERE is_active = true ORDER BY id ASC LIMIT 1',
    );
    if (rows.length === 0) {
      throw new Error(
        'Không có doctor_schedules nào active trong DB test — kiểm tra migration seed đã chạy chưa.',
      );
    }
    doctorSchedule = rows[0];
  });

  afterEach(async () => {
    if (createdAppointmentIds.length > 0) {
      await dataSource.query('DELETE FROM "appointments" WHERE id = ANY($1)', [
        createdAppointmentIds,
      ]);
      createdAppointmentIds.length = 0;
    }
    if (createdRelativeIds.length > 0) {
      await dataSource.query(
        'DELETE FROM "health_profile" WHERE relative_id = ANY($1)',
        [createdRelativeIds],
      );
      await dataSource.query('DELETE FROM "relatives" WHERE id = ANY($1)', [
        createdRelativeIds,
      ]);
      createdRelativeIds.length = 0;
    }
    await cleanupRegisteredUsers(dataSource, createdUserIds);
    createdUserIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('books an appointment for a specific schedule and persists it for real', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);

    const relativeRows = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1',
      [patient.userId],
    );
    const relativeId = relativeRows[0].id;

    const appointmentDate = nextDateMatchingDayOfWeek(
      doctorSchedule.day_of_week,
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send({
        appointment_date: appointmentDate,
        doctor_schedule_id: doctorSchedule.id,
        relative_id: relativeId,
        booking_mode: 'user_select',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
    createdAppointmentIds.push(response.body.data.id);

    const rows = await dataSource.query<
      { patient_id: number; doctor_schedule_id: number }[]
    >(
      'SELECT patient_id, doctor_schedule_id FROM "appointments" WHERE id = $1',
      [response.body.data.id],
    );
    expect(rows[0].patient_id).toBe(relativeId);
    expect(rows[0].doctor_schedule_id).toBe(doctorSchedule.id);
  });

  it('rejects a second booking for the same patient in the same slot with a conflict', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);
    const relativeRows = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1',
      [patient.userId],
    );
    const relativeId = relativeRows[0].id;
    const appointmentDate = nextDateMatchingDayOfWeek(
      doctorSchedule.day_of_week,
    );
    const payload = {
      appointment_date: appointmentDate,
      doctor_schedule_id: doctorSchedule.id,
      relative_id: relativeId,
      booking_mode: 'user_select',
    };

    const first = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send(payload)
      .expect(201);
    createdAppointmentIds.push(first.body.data.id);

    const second = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send(payload);

    expect(second.status).toBe(409);
  });

  it('cancels a PENDING appointment owned by the caller', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);
    const relativeRows = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1',
      [patient.userId],
    );
    const relativeId = relativeRows[0].id;
    const appointmentDate = nextDateMatchingDayOfWeek(
      doctorSchedule.day_of_week,
    );

    const booked = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send({
        appointment_date: appointmentDate,
        doctor_schedule_id: doctorSchedule.id,
        relative_id: relativeId,
        booking_mode: 'user_select',
      })
      .expect(201);
    createdAppointmentIds.push(booked.body.data.id);

    const cancelResponse = await request(app.getHttpServer())
      .delete(`/api/v1/appointments/cancel/${booked.body.data.id}`)
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient');

    expect(cancelResponse.status).toBe(200);
    const rows = await dataSource.query<{ status: string }[]>(
      'SELECT status FROM "appointments" WHERE id = $1',
      [booked.body.data.id],
    );
    expect(rows[0].status).toBe('CANCELLED');
  });

  it('is forbidden for a PATIENT to update appointment status directly (DOCTOR-only permission)', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/appointments/1/status')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(403);
  });

  it('rejects a DOCTOR who is not assigned to the appointment', async () => {
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader: patientCookie } = await loginAs(app, patient);
    const relativeRows = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1',
      [patient.userId],
    );
    const relativeId = relativeRows[0].id;
    const appointmentDate = nextDateMatchingDayOfWeek(
      doctorSchedule.day_of_week,
    );
    const booked = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', patientCookie)
      .set('X-App-Context', 'patient')
      .send({
        appointment_date: appointmentDate,
        doctor_schedule_id: doctorSchedule.id,
        relative_id: relativeId,
        booking_mode: 'user_select',
      })
      .expect(201);
    createdAppointmentIds.push(booked.body.data.id);

    const doctor = await registerAndPromote(app, dataSource, ROLE_NAME.DOCTOR);
    createdUserIds.push(doctor.userId);
    const { cookieHeader: doctorCookie } = await loginAs(
      app,
      doctor,
      '/api/v1/auth/admin/login',
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${booked.body.data.id}/status`)
      .set('Cookie', doctorCookie)
      .set('X-App-Context', 'admin')
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(403);
  });

  it('prevents a double-booking race: two concurrent bookings for the same existing relative + same slot resolve to exactly one appointment', async () => {
    // Quy trình regression test cho fix pessimistic lock trong
    // RelativesService.findOrCreateForBooking (xem relatives.service.ts):
    // trước fix, hai request đặt lịch đồng thời cùng new_relative_profile
    // (khớp một relative ĐÃ TỒN TẠI) có thể cùng "thấy" relative đó chưa bị
    // khoá, rồi cùng vượt qua assertNoPatientConflict (đọc dữ liệu cũ trước
    // khi request kia commit) và cùng tạo được appointment — double-booking
    // thật cho cùng một bệnh nhân, cùng một slot.
    const patient = await registerNewUser(app, dataSource);
    createdUserIds.push(patient.userId);
    const { cookieHeader } = await loginAs(app, patient);

    const phone = `09${Date.now().toString().slice(-8)}`;
    const newRelativeProfile = {
      fullname: 'Integration Test Child',
      relationship_code: 'con_gai',
      dob: '2018-01-01',
      gender: false,
      phone,
    };

    // Bước 1: tạo trước relative này (không đồng thời) để nó THỰC SỰ đã tồn
    // tại trước khi race bắt đầu — đúng kịch bản "relative đã có sẵn" mà
    // finding gốc mô tả.
    const seedScheduleRows = await dataSource.query<DoctorScheduleRow[]>(
      'SELECT id, day_of_week, start_time, end_time FROM "doctor_schedules" WHERE is_active = true ORDER BY id ASC LIMIT 1',
    );
    const seedSchedule = seedScheduleRows[0];
    const seedBooking = await request(app.getHttpServer())
      .post('/api/v1/appointments/booking')
      .set('Cookie', cookieHeader)
      .set('X-App-Context', 'patient')
      .send({
        appointment_date: nextDateMatchingDayOfWeek(seedSchedule.day_of_week),
        doctor_schedule_id: seedSchedule.id,
        new_relative_profile: newRelativeProfile,
        booking_mode: 'user_select',
      })
      .expect(201);
    createdAppointmentIds.push(seedBooking.body.data.id);

    const relativeRowsAfterSeed = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1 AND phone = $2',
      [patient.userId, phone],
    );
    expect(relativeRowsAfterSeed).toHaveLength(1);
    createdRelativeIds.push(relativeRowsAfterSeed[0].id);

    // Bước 2: hai request đặt lịch ĐỒNG THỜI, cùng new_relative_profile
    // (khớp relative vừa tạo ở bước 1), cùng một slot khác (schedule thứ 2)
    // — cả hai đều sẽ resolve về đúng relative đã tồn tại, nhưng chỉ một
    // trong hai được phép đặt cho slot đó.
    const raceScheduleRows = await dataSource.query<DoctorScheduleRow[]>(
      'SELECT id, day_of_week, start_time, end_time FROM "doctor_schedules" WHERE is_active = true AND id != $1 ORDER BY id ASC LIMIT 1',
      [seedSchedule.id],
    );
    if (raceScheduleRows.length === 0) {
      throw new Error('Cần ít nhất 2 doctor_schedules active để test race.');
    }
    const raceSchedule = raceScheduleRows[0];
    const raceAppointmentDate = nextDateMatchingDayOfWeek(
      raceSchedule.day_of_week,
    );
    const racePayload = {
      appointment_date: raceAppointmentDate,
      doctor_schedule_id: raceSchedule.id,
      new_relative_profile: newRelativeProfile,
      booking_mode: 'user_select',
    };

    const [responseA, responseB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/appointments/booking')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'patient')
        .send(racePayload),
      request(app.getHttpServer())
        .post('/api/v1/appointments/booking')
        .set('Cookie', cookieHeader)
        .set('X-App-Context', 'patient')
        .send(racePayload),
    ]);

    for (const response of [responseA, responseB]) {
      if (response.status === 201) {
        createdAppointmentIds.push(response.body.data.id);
      }
    }

    const statuses = [responseA.status, responseB.status].sort((a, b) => a - b);
    // Đúng một request thành công (201), request còn lại bị từ chối rõ ràng
    // (409 Conflict) — KHÔNG được cả hai cùng 201 (double-booking).
    expect(statuses).toEqual([201, 409]);

    const relativeRowsAfterRace = await dataSource.query<{ id: number }[]>(
      'SELECT id FROM "relatives" WHERE user_id = $1 AND phone = $2',
      [patient.userId, phone],
    );
    expect(relativeRowsAfterRace).toHaveLength(1);
    expect(relativeRowsAfterRace[0].id).toBe(relativeRowsAfterSeed[0].id);
  });
});
