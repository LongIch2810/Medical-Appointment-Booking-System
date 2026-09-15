import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { dayNumberToEnum } from '../../shared/enums/dayOfWeek';
import { encrypt } from '../../utils/encryption';

/**
 * Bổ sung dữ liệu giao dịch (appointments, relatives, health_profile,
 * examination_result, satisfaction_rating, notifications, complaints,
 * coach_profile, audit_log, channels/messages, user_settings) còn thiếu
 * hoàn toàn sau migration seed gốc (1779638786395-seedData.ts), để môi
 * trường dev/demo phản ánh một hệ thống đặt khám đang hoạt động thật.
 *
 * Không đụng tới dữ liệu do seed gốc tạo (roles/permissions/specialties/
 * users cũ/doctors/doctor_schedules/relationships/topics/tags/articles).
 */
export class SeedTransactionalData1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration này chỉ CỘNG THÊM dữ liệu (20 bệnh nhân mới + toàn bộ
    // relative/appointment/... gắn với riêng họ). Không dựa vào "bảng
    // appointments rỗng" để quyết định chạy hay không, vì trong quá trình
    // phát triển đã có dữ liệu thật (Playwright e2e, thao tác thủ công)
    // được tạo qua ứng dụng thật — migration này không được đụng tới
    // những dữ liệu đó. Idempotency thực sự dựa vào cơ chế bookkeeping
    // bảng "migrations" của TypeORM (migration chỉ chạy đúng 1 lần), như
    // toàn bộ migration khác trong repo.
    const alreadySeeded: { count: string }[] = await queryRunner.query(
      `SELECT COUNT(*)::text AS count FROM "users" WHERE "email" = 'dinhthikieuoanh@gmail.com'`,
    );
    if (Number(alreadySeeded[0].count) > 0) {
      return;
    }

    const passwordHash = bcrypt.hashSync('Patient@123', 10);

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
    const weightedPick = <T>(items: { value: T; weight: number }[]): T => {
      const total = items.reduce((s, i) => s + i.weight, 0);
      let r = Math.random() * total;
      for (const item of items) {
        if (r < item.weight) return item.value;
        r -= item.weight;
      }
      return items[items.length - 1].value;
    };
    const addDays = (date: Date, days: number): Date => {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    };
    const toDateStr = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ---------------------------------------------------------------
    // 1. Đọc dữ liệu đã seed sẵn / đã có thật (không đoán id)
    // ---------------------------------------------------------------
    const adminRow: { id: number }[] = await queryRunner.query(
      `SELECT id FROM "users" WHERE "isAdmin" = true ORDER BY id ASC LIMIT 1`,
    );
    const adminUserId = adminRow[0].id;

    const doctorsInfo: {
      id: number;
      specialty_id: number;
      fullname: string;
    }[] = await queryRunner.query(`
        SELECT d.id, d.specialty_id, u.fullname
        FROM "doctors" d
        INNER JOIN "users" u ON u.id = d.user_id
      `);
    const doctorsInfoById = new Map(doctorsInfo.map((d) => [d.id, d]));

    const schedules: {
      id: number;
      doctor_id: number;
      day_of_week: string;
      start_time: string;
      end_time: string;
    }[] = await queryRunner.query(`
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM "doctor_schedules"
      WHERE is_active = true
    `);
    const schedulesByDay = new Map<string, typeof schedules>();
    for (const s of schedules) {
      const list = schedulesByDay.get(s.day_of_week) ?? [];
      list.push(s);
      schedulesByDay.set(s.day_of_week, list);
    }
    const doctorIds = [...new Set(schedules.map((s) => s.doctor_id))];
    const doctorWeight = new Map<number, number>();
    for (const id of doctorIds) doctorWeight.set(id, randomInt(5, 20) / 10);

    // Chặn tái sử dụng (doctor_schedule_id, appointment_date) đã có appointment
    // thật từ trước (Playwright e2e / thao tác thủ công) để không vi phạm
    // unique index "unique_doctor_schedule_date" và không tạo dữ liệu chồng lấn.
    const existingAppointmentSlots: {
      doctor_schedule_id: number;
      appointment_date: string;
    }[] = await queryRunner.query(`
      SELECT doctor_schedule_id, appointment_date::text AS appointment_date
      FROM "appointments"
    `);

    // ---------------------------------------------------------------
    // 2. Thêm 20 bệnh nhân (user) mới
    // ---------------------------------------------------------------
    const newPatients = [
      {
        username: 'dinhthikieuoanh',
        email: 'dinhthikieuoanh@gmail.com',
        phone: '0901000006',
        fullname: 'Đinh Thị Kiều Oanh',
        gender: false,
        dob: '1993-02-14',
        address: 'Số 12, Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
      },
      {
        username: 'buiquangvinh',
        email: 'buiquangvinh@gmail.com',
        phone: '0901000007',
        fullname: 'Bùi Quang Vinh',
        gender: true,
        dob: '1978-06-25',
        address:
          'Số 34, Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
      },
      {
        username: 'ngothithuthao',
        email: 'ngothithuthao@yahoo.com',
        phone: '0901000008',
        fullname: 'Ngô Thị Thu Thảo',
        gender: false,
        dob: '1999-09-03',
        address: 'Số 56, Đường Cách Mạng Tháng Tám, Phường 5, Quận 3, TP.HCM',
      },
      {
        username: 'phanminhtri',
        email: 'phanminhtri@gmail.com',
        phone: '0901000009',
        fullname: 'Phan Minh Trí',
        gender: true,
        dob: '1986-11-19',
        address: 'Số 78, Đường Trần Hưng Đạo, Phường Cầu Kho, Quận 1, TP.HCM',
      },
      {
        username: 'duongthingocanh',
        email: 'duongthingocanh@gmail.com',
        phone: '0901000010',
        fullname: 'Dương Thị Ngọc Ánh',
        gender: false,
        dob: '1965-04-08',
        address:
          'Số 9, Đường Bà Triệu, Phường Nguyễn Du, Quận Hai Bà Trưng, Hà Nội',
      },
      {
        username: 'vohoangphuc',
        email: 'vohoangphuc@gmail.com',
        phone: '0901000011',
        fullname: 'Võ Hoàng Phúc',
        gender: true,
        dob: '1997-01-27',
        address: 'Số 120, Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      },
      {
        username: 'hoangthanhthuy',
        email: 'hoangthanhthuy@yahoo.com',
        phone: '0901000012',
        fullname: 'Hoàng Thanh Thủy',
        gender: false,
        dob: '1972-08-30',
        address:
          'Số 45, Đường Lê Duẩn, Phường Xuân Hà, Quận Thanh Khê, Đà Nẵng',
      },
      {
        username: 'nguyentrongkhang',
        email: 'nguyentrongkhang@gmail.com',
        phone: '0901000013',
        fullname: 'Nguyễn Trọng Khang',
        gender: true,
        dob: '1990-03-11',
        address:
          'Số 67, Đường Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM',
      },
      {
        username: 'lamthihoaimy',
        email: 'lamthihoaimy@gmail.com',
        phone: '0901000014',
        fullname: 'Lâm Thị Hoài My',
        gender: false,
        dob: '2001-07-22',
        address: 'Số 23, Đường Trần Não, Phường An Khánh, TP. Thủ Đức, TP.HCM',
      },
      {
        username: 'truongvanhung',
        email: 'truongvanhung@yahoo.com',
        phone: '0901000015',
        fullname: 'Trương Văn Hùng',
        gender: true,
        dob: '1968-12-05',
        address:
          'Số 88, Đường Phan Chu Trinh, Phường Phú Nhuận, TP Huế, Thừa Thiên Huế',
      },
      {
        username: 'chauthidiemquynh',
        email: 'chauthidiemquynh@gmail.com',
        phone: '0901000016',
        fullname: 'Châu Thị Diễm Quỳnh',
        gender: false,
        dob: '1994-05-17',
        address:
          'Số 51, Đường Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, Cần Thơ',
      },
      {
        username: 'lyminhkhoa',
        email: 'lyminhkhoa@gmail.com',
        phone: '0901000017',
        fullname: 'Lý Minh Khoa',
        gender: true,
        dob: '1982-10-09',
        address:
          'Số 14, Đường Hoàng Hoa Thám, Phường Vĩnh Trung, Quận Thanh Khê, Đà Nẵng',
      },
      {
        username: 'daothilinhchi',
        email: 'daothilinhchi@gmail.com',
        phone: '0901000018',
        fullname: 'Đào Thị Linh Chi',
        gender: false,
        dob: '1996-02-28',
        address:
          'Số 99, Đường Lê Lợi, Phường Vĩnh Ninh, TP Huế, Thừa Thiên Huế',
      },
      {
        username: 'huynhcongthanh',
        email: 'huynhcongthanh@yahoo.com',
        phone: '0901000019',
        fullname: 'Huỳnh Công Thành',
        gender: true,
        dob: '1975-09-14',
        address: 'Số 6, Đường 30/4, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
      },
      {
        username: 'maithixuanmai',
        email: 'maithixuanmai@gmail.com',
        phone: '0901000020',
        fullname: 'Mai Thị Xuân Mai',
        gender: false,
        dob: '1989-06-06',
        address:
          'Số 30, Đường Nguyễn Chí Thanh, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
      },
      {
        username: 'dangvantoan',
        email: 'dangvantoan@gmail.com',
        phone: '0901000021',
        fullname: 'Đặng Văn Toàn',
        gender: true,
        dob: '2000-04-01',
        address:
          'Số 41, Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
      },
      {
        username: 'buithithanhtam',
        email: 'buithithanhtam@gmail.com',
        phone: '0901000022',
        fullname: 'Bùi Thị Thanh Tâm',
        gender: false,
        dob: '1970-11-23',
        address: 'Số 17, Đường Lý Thường Kiệt, Phường 6, Quận Tân Bình, TP.HCM',
      },
      {
        username: 'trinhquangduc',
        email: 'trinhquangduc@yahoo.com',
        phone: '0901000023',
        fullname: 'Trịnh Quang Đức',
        gender: true,
        dob: '1984-08-16',
        address:
          'Số 52, Đường Nguyễn Thái Học, Phường Điện Biên, Quận Ba Đình, Hà Nội',
      },
      {
        username: 'phamthihuongly',
        email: 'phamthihuongly@gmail.com',
        phone: '0901000024',
        fullname: 'Phạm Thị Hương Ly',
        gender: false,
        dob: '1998-12-30',
        address:
          'Số 63, Đường Trần Phú, Phường Vạn Thắng, Nha Trang, Khánh Hòa',
      },
      {
        username: 'nguyenductoan',
        email: 'nguyenductoan@gmail.com',
        phone: '0901000025',
        fullname: 'Nguyễn Đức Toàn',
        gender: true,
        dob: '1966-07-07',
        address:
          'Số 8, Đường Hùng Vương, Phường Phước Tiến, Nha Trang, Khánh Hòa',
      },
    ];

    const newPatientUsers: {
      id: number;
      fullname: string;
      gender: boolean;
      date_of_birth: string;
      phone: string | null;
    }[] = [];
    for (const p of newPatients) {
      const createdAt = toDateStr(addDays(today, -randomInt(3, 120)));
      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "users" ("username","email","password","phone","fullname","gender","date_of_birth","picture","address","isAdmin","is_active","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,true,$10,$10)
          RETURNING id
        `,
        [
          p.username,
          p.email,
          passwordHash,
          p.phone,
          p.fullname,
          p.gender,
          p.dob,
          'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
          p.address,
          createdAt,
        ],
      );
      const id = rows[0].id;
      await queryRunner.query(
        `INSERT INTO "user_roles" ("user_id","role_id") VALUES ($1, 3)`,
        [id],
      );
      newPatientUsers.push({
        id,
        fullname: p.fullname,
        gender: p.gender,
        date_of_birth: p.dob,
        phone: p.phone,
      });

      await queryRunner.query(
        `
          INSERT INTO "user_settings" ("is_notification_email","is_reminder_appoinments","user_id")
          VALUES ($1,$2,$3)
        `,
        [Math.random() < 0.85, Math.random() < 0.9, id],
      );
    }

    // Chỉ tạo relative/appointment/... mới gắn với 20 bệnh nhân MỚI này —
    // không đụng tới 5 patient user cũ (đã có dữ liệu thật/e2e-test thật
    // trong quá trình phát triển), để migration cộng thêm dữ liệu một
    // cách an toàn, không trộn lẫn và có thể revert chính xác.
    const allPatientUsers = newPatientUsers;

    // ---------------------------------------------------------------
    // 3. Relatives — 1 "bản thân" cho mỗi patient mới + một số người thân
    // ---------------------------------------------------------------
    type RelativeRow = { relativeId: number; userId: number; fullname: string };
    const allRelatives: RelativeRow[] = [];

    for (const u of allPatientUsers) {
      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "relatives" ("user_id","fullname","relationship_code","phone","dob","gender","created_at","updated_at")
          VALUES ($1,$2,'ban_than',NULL,$3,$4,now(),now())
          RETURNING id
        `,
        [u.id, u.fullname, u.date_of_birth, u.gender],
      );
      allRelatives.push({
        relativeId: rows[0].id,
        userId: u.id,
        fullname: u.fullname,
      });
    }

    const extraRelatives = [
      {
        patientIndex: 0,
        fullname: 'Đinh Văn Sáu',
        relationship_code: 'cha',
        gender: true,
        dob: '1965-03-12',
        phone: '0902000001',
      },
      {
        patientIndex: 1,
        fullname: 'Bùi Gia Bảo',
        relationship_code: 'con_trai',
        gender: true,
        dob: '2015-05-20',
        phone: null,
      },
      {
        patientIndex: 2,
        fullname: 'Ngô Thị Kim Cúc',
        relationship_code: 'me',
        gender: false,
        dob: '1968-01-15',
        phone: '0902000002',
      },
      {
        patientIndex: 3,
        fullname: 'Phan Bảo Ngọc',
        relationship_code: 'con_gai',
        gender: false,
        dob: '2012-09-08',
        phone: null,
      },
      {
        patientIndex: 4,
        fullname: 'Dương Văn Phát',
        relationship_code: 'vo_chong',
        gender: true,
        dob: '1963-07-02',
        phone: '0902000003',
      },
      {
        patientIndex: 5,
        fullname: 'Võ Thị Bé Ba',
        relationship_code: 'ba',
        gender: false,
        dob: '1948-11-30',
        phone: null,
      },
      {
        patientIndex: 6,
        fullname: 'Hoàng Gia Huy',
        relationship_code: 'con_trai',
        gender: true,
        dob: '2009-04-18',
        phone: '0902000004',
      },
      {
        patientIndex: 8,
        fullname: 'Lâm Thị Hồng',
        relationship_code: 'me',
        gender: false,
        dob: '1971-06-25',
        phone: null,
      },
      {
        patientIndex: 9,
        fullname: 'Trương Ngọc Hân',
        relationship_code: 'con_gai',
        gender: false,
        dob: '2018-02-14',
        phone: '0902000005',
      },
      {
        patientIndex: 12,
        fullname: 'Đào Văn Khiêm',
        relationship_code: 'ong',
        gender: true,
        dob: '1950-08-09',
        phone: null,
      },
      {
        patientIndex: 14,
        fullname: 'Mai Xuân Bách',
        relationship_code: 'con_trai',
        gender: true,
        dob: '2011-10-27',
        phone: '0902000006',
      },
      {
        patientIndex: 16,
        fullname: 'Bùi Thị Ngọc Hà',
        relationship_code: 'con_gai',
        gender: false,
        dob: '2016-12-03',
        phone: null,
      },
      {
        patientIndex: 18,
        fullname: 'Phạm Thị Mến',
        relationship_code: 'me',
        gender: false,
        dob: '1974-03-19',
        phone: '0902000007',
      },
      {
        patientIndex: 19,
        fullname: 'Nguyễn Thị Sáu',
        relationship_code: 'vo_chong',
        gender: false,
        dob: '1969-05-05',
        phone: null,
      },
      {
        patientIndex: 7,
        fullname: 'Nguyễn Thân Khác',
        relationship_code: 'nguoi_than_khac',
        gender: true,
        dob: '1992-01-01',
        phone: '0902000008',
      },
    ];

    for (const r of extraRelatives) {
      const owner = newPatientUsers[r.patientIndex];
      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "relatives" ("user_id","fullname","relationship_code","phone","dob","gender","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,now(),now())
          RETURNING id
        `,
        [owner.id, r.fullname, r.relationship_code, r.phone, r.dob, r.gender],
      );
      allRelatives.push({
        relativeId: rows[0].id,
        userId: owner.id,
        fullname: r.fullname,
      });
    }

    // ---------------------------------------------------------------
    // 4. Health profile — 1-1 cho mỗi relative
    // ---------------------------------------------------------------
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    for (let i = 0; i < allRelatives.length; i++) {
      const rich = i % 5 !== 0; // ~80% có hồ sơ khá đầy đủ, ~20% gần như trống
      if (rich) {
        await queryRunner.query(
          `
            INSERT INTO "health_profile"
              ("weight","height","blood_type","medical_history","allergies","heart_rate","blood_pressure","glucose_level","cholesterol_level","medications","vaccinations","smoking","alcohol_consumption","exercise_frequency","last_checkup_date","relative_id","created_at","updated_at")
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),now())
          `,
          [
            randomInt(45, 90),
            randomInt(150, 185),
            pick(bloodTypes),
            pick([
              'Không có bệnh nền',
              'Tăng huyết áp',
              'Tiểu đường type 2',
              'Viêm dạ dày mãn tính',
              'Không có bệnh nền',
            ]),
            pick([
              'Không dị ứng',
              'Dị ứng hải sản',
              'Dị ứng phấn hoa',
              'Dị ứng penicillin',
              'Không dị ứng',
            ]),
            randomInt(62, 95),
            `${randomInt(105, 135)}/${randomInt(65, 88)}`,
            randomInt(75, 130),
            randomInt(150, 220),
            pick([
              'Không dùng thuốc thường xuyên',
              'Metformin 500mg/ngày',
              'Amlodipine 5mg/ngày',
              'Không dùng thuốc thường xuyên',
            ]),
            pick([
              'Đã tiêm đủ vắc xin cơ bản',
              'Đã tiêm vắc xin cúm mùa',
              'Đã tiêm vắc xin COVID-19 3 mũi',
            ]),
            Math.random() < 0.15,
            Math.random() < 0.25,
            pick([
              'Không tập thể dục',
              '1-2 lần/tuần',
              '3-4 lần/tuần',
              'Hàng ngày',
            ]),
            toDateStr(addDays(today, -randomInt(10, 400))),
            allRelatives[i].relativeId,
          ],
        );
      } else {
        await queryRunner.query(
          `
            INSERT INTO "health_profile" ("relative_id","created_at","updated_at")
            VALUES ($1, now(), now())
          `,
          [allRelatives[i].relativeId],
        );
      }
    }

    // ---------------------------------------------------------------
    // 5. Appointments
    // ---------------------------------------------------------------
    const statusWeights: { value: string; weight: number }[] = [
      { value: 'COMPLETED', weight: 45 },
      { value: 'PENDING', weight: 20 },
      { value: 'CONFIRMED', weight: 15 },
      { value: 'CANCELLED', weight: 10 },
      { value: 'ABSENT', weight: 5 },
      { value: 'EXPIRED', weight: 5 },
    ];

    const usedSchedulePairs = new Set<string>();
    for (const slot of existingAppointmentSlots) {
      usedSchedulePairs.add(
        `${slot.doctor_schedule_id}|${slot.appointment_date}`,
      );
    }
    const usedPatientDate = new Set<string>();
    const TARGET_APPOINTMENTS = 220;
    const MAX_ATTEMPTS = TARGET_APPOINTMENTS * 25;

    type CreatedAppointment = {
      id: number;
      status: string;
      appointment_date: string;
      doctor_id: number;
      specialty_id: number;
      doctor_fullname: string;
      relative_id: number;
      relative_fullname: string;
      user_id: number;
      start_time: string;
    };
    const createdAppointments: CreatedAppointment[] = [];

    let attempts = 0;
    while (
      createdAppointments.length < TARGET_APPOINTMENTS &&
      attempts < MAX_ATTEMPTS
    ) {
      attempts++;
      const status = weightedPick(statusWeights);

      let dateStr: string;
      if (
        status === 'COMPLETED' ||
        status === 'CANCELLED' ||
        status === 'ABSENT'
      ) {
        dateStr = toDateStr(addDays(today, -randomInt(1, 60)));
      } else if (status === 'EXPIRED') {
        dateStr = toDateStr(addDays(today, -randomInt(1, 14)));
      } else if (status === 'CONFIRMED') {
        dateStr = toDateStr(addDays(today, randomInt(0, 10)));
      } else {
        dateStr = toDateStr(addDays(today, randomInt(0, 21)));
      }

      const dateObj = new Date(`${dateStr}T00:00:00`);
      const dow = dayNumberToEnum[dateObj.getDay()];
      const daySchedules = schedulesByDay.get(dow) ?? [];
      const candidates = daySchedules.filter(
        (s) => !usedSchedulePairs.has(`${s.id}|${dateStr}`),
      );
      if (candidates.length === 0) continue;

      const schedule = weightedPick(
        candidates.map((s) => ({
          value: s,
          weight: doctorWeight.get(s.doctor_id) ?? 1,
        })),
      );

      let relative = pick(allRelatives);
      let guard = 0;
      while (
        usedPatientDate.has(`${relative.relativeId}|${dateStr}`) &&
        guard < 15
      ) {
        relative = pick(allRelatives);
        guard++;
      }
      if (usedPatientDate.has(`${relative.relativeId}|${dateStr}`)) continue;

      usedSchedulePairs.add(`${schedule.id}|${dateStr}`);
      usedPatientDate.add(`${relative.relativeId}|${dateStr}`);

      const bookingMode = Math.random() < 0.15 ? 'ai_select' : 'user_select';
      const bookedByUserId =
        Math.random() < 0.05 ? adminUserId : relative.userId;
      const createdAt = toDateStr(addDays(dateObj, -randomInt(1, 10)));

      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "appointments"
            ("appointment_date","status","booking_mode","doctor_schedule_id","patient_id","user_id","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
          RETURNING id
        `,
        [
          dateStr,
          status,
          bookingMode,
          schedule.id,
          relative.relativeId,
          bookedByUserId,
          createdAt,
        ],
      );

      const doctorInfo = doctorsInfoById.get(schedule.doctor_id)!;
      createdAppointments.push({
        id: rows[0].id,
        status,
        appointment_date: dateStr,
        doctor_id: schedule.doctor_id,
        specialty_id: doctorInfo.specialty_id,
        doctor_fullname: doctorInfo.fullname,
        relative_id: relative.relativeId,
        relative_fullname: relative.fullname,
        user_id: relative.userId,
        start_time: schedule.start_time,
      });
    }

    // ---------------------------------------------------------------
    // 6. Examination result — ~90% các appointment COMPLETED
    // ---------------------------------------------------------------
    const clinicalNotes = [
      {
        symptoms: 'Đau ngực âm ỉ, hồi hộp đánh trống ngực khi gắng sức',
        diagnosis: 'Tăng huyết áp độ I, theo dõi rối loạn nhịp tim',
        treatment:
          'Điều chỉnh chế độ ăn giảm muối, tái khám sau 4 tuần, theo dõi huyết áp tại nhà',
        prescription: 'Amlodipine 5mg x 1 viên/ngày sau ăn sáng',
      },
      {
        symptoms: 'Đau bụng vùng thượng vị, ợ chua, buồn nôn sau ăn',
        diagnosis: 'Viêm dạ dày mãn tính, nghi ngờ trào ngược dạ dày thực quản',
        treatment: 'Nội soi dạ dày kiểm tra, hạn chế đồ cay nóng và rượu bia',
        prescription: 'Omeprazole 20mg x 1 viên/ngày trước ăn sáng, 4 tuần',
      },
      {
        symptoms: 'Ho khan kéo dài, khó thở nhẹ khi vận động, sổ mũi',
        diagnosis: 'Viêm phế quản cấp',
        treatment:
          'Nghỉ ngơi, uống nhiều nước ấm, tái khám nếu sốt trên 38.5 độ',
        prescription: 'Acetylcystein 200mg x 2 lần/ngày, 5 ngày',
      },
      {
        symptoms: 'Nổi mẩn đỏ, ngứa vùng cánh tay và lưng, không sốt',
        diagnosis: 'Viêm da tiếp xúc dị ứng',
        treatment:
          'Tránh tiếp xúc chất gây dị ứng nghi ngờ, giữ vùng da khô thoáng',
        prescription:
          'Cetirizine 10mg x 1 viên/ngày, kem bôi Hydrocortisone 1% x 7 ngày',
      },
      {
        symptoms: 'Đau khớp gối hai bên, cứng khớp buổi sáng khoảng 20 phút',
        diagnosis: 'Thoái hóa khớp gối giai đoạn nhẹ',
        treatment:
          'Vật lý trị liệu, giảm cân nếu thừa cân, hạn chế leo cầu thang',
        prescription: 'Paracetamol 500mg khi đau, Glucosamine 1500mg/ngày',
      },
      {
        symptoms: 'Sốt nhẹ, quấy khóc, chán ăn ở trẻ nhỏ',
        diagnosis: 'Viêm họng cấp do virus',
        treatment:
          'Hạ sốt khi trên 38.5 độ, bù nước điện giải, tái khám nếu không cải thiện sau 3 ngày',
        prescription: 'Paracetamol siro theo cân nặng khi sốt, Oresol pha uống',
      },
      {
        symptoms: 'Đau tai, ù tai một bên, giảm thính lực nhẹ',
        diagnosis: 'Viêm tai giữa cấp',
        treatment:
          'Vệ sinh tai đúng cách, tránh nước vào tai, tái khám sau 1 tuần',
        prescription: 'Amoxicillin 500mg x 3 lần/ngày, 7 ngày',
      },
      {
        symptoms: 'Mờ mắt khi nhìn xa, mỏi mắt khi làm việc máy tính lâu',
        diagnosis: 'Tật khúc xạ cận thị tiến triển nhẹ',
        treatment: 'Đo lại độ kính, hạn chế nhìn màn hình liên tục quá 45 phút',
        prescription: 'Nước mắt nhân tạo nhỏ 3 lần/ngày khi khô mắt',
      },
      {
        symptoms: 'Mất ngủ, đau đầu căng thẳng, lo âu kéo dài',
        diagnosis: 'Rối loạn lo âu nhẹ, mất ngủ liên quan stress',
        treatment:
          'Tư vấn tâm lý, tập thể dục đều đặn, hạn chế caffeine buổi chiều',
        prescription: 'Rotundin 30mg trước ngủ khi cần, tối đa 2 tuần',
      },
      {
        symptoms: 'Khám thai định kỳ, không có triệu chứng bất thường',
        diagnosis: 'Thai kỳ phát triển bình thường theo tuổi thai',
        treatment: 'Bổ sung sắt và acid folic, tái khám định kỳ theo lịch',
        prescription: 'Sắt + Acid folic 1 viên/ngày, Canxi 1 viên/ngày',
      },
      {
        symptoms: 'Tiểu buốt, tiểu rắt, đau vùng thắt lưng nhẹ',
        diagnosis: 'Nhiễm khuẩn đường tiết niệu dưới',
        treatment:
          'Uống nhiều nước, vệ sinh cá nhân đúng cách, tái khám nếu sốt cao',
        prescription: 'Ciprofloxacin 500mg x 2 lần/ngày, 5 ngày',
      },
      {
        symptoms: 'Mệt mỏi kéo dài, sụt cân nhẹ, ăn uống kém',
        diagnosis: 'Suy nhược cơ thể, cần tầm soát thêm nguyên nhân',
        treatment:
          'Xét nghiệm máu tổng quát, bổ sung dinh dưỡng, tái khám sau 2 tuần',
        prescription: 'Vitamin tổng hợp 1 viên/ngày sau ăn',
      },
    ];
    const feedbackPool = [
      'Bác sĩ tư vấn tận tình, giải thích rõ ràng, rất hài lòng.',
      'Thời gian chờ hơi lâu nhưng chất lượng khám tốt.',
      'Bác sĩ chuyên nghiệp, phòng khám sạch sẽ, sẽ quay lại.',
      'Được tư vấn chi tiết về cách dùng thuốc, cảm ơn bác sĩ.',
      'Dịch vụ tốt, đặt lịch nhanh chóng và thuận tiện.',
      'Bác sĩ khám kỹ, giải đáp hết thắc mắc của tôi.',
      'Rất hài lòng với thái độ phục vụ của cả bác sĩ và nhân viên.',
      'Kết quả khám chính xác, phác đồ điều trị hiệu quả.',
      'Cần cải thiện thời gian chờ vào giờ cao điểm.',
      'Nhìn chung ổn, bác sĩ nhiệt tình nhưng phòng khám hơi đông.',
    ];

    const examResultByAppointmentId = new Map<number, number>();
    for (const appt of createdAppointments) {
      if (appt.status !== 'COMPLETED') continue;
      if (Math.random() >= 0.9) continue;
      const note = pick(clinicalNotes);
      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "examination_result" ("symptoms","diagnosis","treatment","prescription","appointment_id","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,$6)
          RETURNING id
        `,
        [
          note.symptoms,
          note.diagnosis,
          note.treatment,
          note.prescription,
          appt.id,
          appt.appointment_date,
        ],
      );
      examResultByAppointmentId.set(appt.id, rows[0].id);

      if (Math.random() < 0.7) {
        const score = 5;
        const ratedAt = toDateStr(
          addDays(
            new Date(`${appt.appointment_date}T00:00:00`),
            randomInt(0, 3),
          ),
        );
        await queryRunner.query(
          `
            INSERT INTO "satisfaction_rating" ("rating_score","feedback","appointment_id","created_at","updated_at")
            VALUES ($1,$2,$3,$4,$4)
          `,
          [score, pick(feedbackPool), appt.id, ratedAt],
        );
      }
    }

    // ---------------------------------------------------------------
    // 7. Notifications — gắn với sự kiện appointment thật
    // ---------------------------------------------------------------
    for (const appt of createdAppointments) {
      if (Math.random() >= 0.4) continue;
      let title: string;
      let content: string;
      let isNotified: boolean;
      if (appt.status === 'CANCELLED') {
        title = 'Lịch hẹn đã bị hủy';
        content = `Lịch khám với BS. ${appt.doctor_fullname} vào ngày ${appt.appointment_date} đã bị hủy.`;
        isNotified = true;
      } else if (appt.status === 'CONFIRMED') {
        title = 'Lịch hẹn đã được xác nhận';
        content = `Lịch khám với BS. ${appt.doctor_fullname} vào ngày ${appt.appointment_date} lúc ${appt.start_time} đã được xác nhận.`;
        isNotified = Math.random() < 0.85;
      } else if (appt.status === 'COMPLETED') {
        title = 'Kết quả khám đã sẵn sàng';
        content = `Kết quả khám với BS. ${appt.doctor_fullname} ngày ${appt.appointment_date} đã được cập nhật.`;
        isNotified = true;
      } else if (appt.status === 'EXPIRED') {
        title = 'Lịch hẹn đã quá hạn';
        content = `Lịch khám với BS. ${appt.doctor_fullname} ngày ${appt.appointment_date} đã quá hạn do không được xác nhận kịp thời.`;
        isNotified = true;
      } else {
        title = 'Nhắc lịch khám sắp tới';
        content = `Bạn có lịch hẹn khám với BS. ${appt.doctor_fullname} vào ngày ${appt.appointment_date} lúc ${appt.start_time}.`;
        isNotified = Math.random() < 0.6;
      }
      await queryRunner.query(
        `
          INSERT INTO "notifications" ("content","title","is_notified","user_id","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$5)
        `,
        [content, title, isNotified, appt.user_id, appt.appointment_date],
      );
    }

    // ---------------------------------------------------------------
    // 8. Complaints
    // ---------------------------------------------------------------
    const complaints = [
      {
        userIdx: 0,
        title: 'Nhân viên lễ tân thái độ chưa tốt',
        description:
          'Khi tôi tới quầy lễ tân để hỏi thông tin, nhân viên trả lời khá cộc lốc và thiếu nhiệt tình.',
        status: 'resolved',
        response:
          'Cảm ơn phản ánh của quý khách. Phòng khám đã nhắc nhở và đào tạo lại nhân viên liên quan.',
      },
      {
        userIdx: 1,
        title: 'Thời gian chờ khám quá lâu',
        description:
          'Tôi đặt lịch 9h nhưng phải chờ đến gần 10h30 mới được vào khám mà không có thông báo trước.',
        status: 'in_progress',
        response: null,
      },
      {
        userIdx: 2,
        title: 'Sai lệch thông tin lịch hẹn',
        description:
          'Hệ thống gửi thông báo lịch hẹn sai ngày so với ngày tôi đã đặt ban đầu.',
        status: 'resolved',
        response:
          'Lỗi đã được kỹ thuật kiểm tra và khắc phục, xin lỗi vì sự bất tiện này.',
      },
      {
        userIdx: 3,
        title: 'Không nhận được thông báo nhắc lịch',
        description:
          'Tôi có lịch khám nhưng không nhận được bất kỳ thông báo nhắc nhở nào trước đó.',
        status: 'pending',
        response: null,
      },
      {
        userIdx: 4,
        title: 'Khu vực chờ khám hơi chật',
        description:
          'Vào giờ cao điểm khu vực chờ khá đông và không đủ ghế ngồi.',
        status: 'in_progress',
        response: null,
      },
      {
        userIdx: 5,
        title: 'Yêu cầu hoàn tiền do hủy lịch',
        description:
          'Tôi đã hủy lịch khám trước 24 giờ nhưng chưa thấy được xử lý hoàn phí.',
        status: 'resolved',
        response:
          'Yêu cầu hoàn phí đã được xử lý, quý khách vui lòng kiểm tra lại tài khoản.',
      },
      {
        userIdx: 6,
        title: 'Ứng dụng bị lỗi khi đặt lịch',
        description:
          'Khi thao tác chọn khung giờ khám, ứng dụng bị treo và phải thoát ra làm lại nhiều lần.',
        status: 'in_progress',
        response: null,
      },
      {
        userIdx: 7,
        title: 'Bác sĩ đến trễ giờ hẹn',
        description:
          'Lịch hẹn 14h nhưng bác sĩ đến muộn gần 30 phút không có thông báo.',
        status: 'resolved',
        response:
          'Phòng khám xin lỗi vì sự chậm trễ và đã nhắc nhở bác sĩ liên quan.',
      },
      {
        userIdx: 9,
        title: 'Thắc mắc về chi phí khám',
        description:
          'Chi phí thực tế thanh toán cao hơn so với thông tin niêm yết ban đầu.',
        status: 'pending',
        response: null,
      },
      {
        userIdx: 11,
        title: 'Không thể cập nhật hồ sơ sức khỏe',
        description:
          'Tôi cố gắng cập nhật thông tin hồ sơ sức khỏe nhiều lần nhưng hệ thống báo lỗi.',
        status: 'rejected',
        response:
          'Đã kiểm tra và không phát hiện lỗi hệ thống, có thể do kết nối mạng phía người dùng.',
      },
      {
        userIdx: 13,
        title: 'Đề nghị thêm khung giờ khám buổi tối',
        description:
          'Mong phòng khám mở thêm khung giờ khám sau 18h để thuận tiện cho người đi làm.',
        status: 'pending',
        response: null,
      },
      {
        userIdx: 15,
        title: 'Nhầm lẫn kết quả khám giữa hai bệnh nhân',
        description:
          'Tôi nhận được thông báo kết quả khám không đúng với triệu chứng đã trình bày.',
        status: 'resolved',
        response:
          'Đã xác minh và đính chính lại kết quả khám đúng cho quý khách, xin lỗi vì sự nhầm lẫn.',
      },
      {
        userIdx: 17,
        title: 'Không hài lòng về không gian phòng khám',
        description: 'Phòng khám hơi ồn do gần khu vực sảnh chờ.',
        status: 'in_progress',
        response: null,
      },
      {
        userIdx: 19,
        title: 'Góp ý cải thiện giao diện đặt lịch',
        description:
          'Giao diện chọn bác sĩ và khung giờ khá rối, mong được tối ưu lại cho dễ sử dụng hơn.',
        status: 'pending',
        response: null,
      },
    ];
    for (const c of complaints) {
      const user = newPatientUsers[c.userIdx] ?? allPatientUsers[c.userIdx];
      await queryRunner.query(
        `
          INSERT INTO "complaints" ("title","description","complaint_status","response","user_id","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,$6)
        `,
        [
          c.title,
          c.description,
          c.status,
          c.response,
          user.id,
          toDateStr(addDays(today, -randomInt(1, 45))),
        ],
      );
    }

    // ---------------------------------------------------------------
    // 9. Coach profile + audit_log(entity_name='coach-profile')
    // ---------------------------------------------------------------
    const coachProfiles = [
      {
        userIdx: 0,
        health_goal: 'Giảm cân và cải thiện vóc dáng',
        preferences: ['Chạy bộ', 'Ăn kiêng low-carb'],
        age: 31,
        height: 160,
        weight: 62,
      },
      {
        userIdx: 1,
        health_goal: 'Tăng cơ và thể lực',
        preferences: ['Tập gym', 'Ăn nhiều protein'],
        age: 46,
        height: 172,
        weight: 78,
      },
      {
        userIdx: 2,
        health_goal: 'Kiểm soát đường huyết ổn định',
        preferences: ['Đi bộ', 'Ăn ít đường'],
        age: 25,
        height: 158,
        weight: 55,
      },
      {
        userIdx: 3,
        health_goal: 'Cải thiện giấc ngủ và giảm stress',
        preferences: ['Yoga', 'Thiền định'],
        age: 38,
        height: 170,
        weight: 70,
      },
      {
        userIdx: 4,
        health_goal: 'Duy trì cân nặng hiện tại',
        preferences: ['Đạp xe', 'Ăn cân bằng dinh dưỡng'],
        age: 60,
        height: 155,
        weight: 58,
      },
      {
        userIdx: 6,
        health_goal: 'Cải thiện sức khỏe tim mạch',
        preferences: ['Bơi lội', 'Hạn chế muối'],
        age: 53,
        height: 165,
        weight: 68,
      },
      {
        userIdx: 7,
        health_goal: 'Tăng cân lành mạnh',
        preferences: ['Tập tạ nhẹ', 'Ăn nhiều bữa nhỏ'],
        age: 35,
        height: 175,
        weight: 60,
      },
      {
        userIdx: 8,
        health_goal: 'Giảm mỡ bụng',
        preferences: ['Chạy bộ', 'Nhịn ăn gián đoạn'],
        age: 24,
        height: 162,
        weight: 54,
      },
      {
        userIdx: 9,
        health_goal: 'Duy trì lối sống năng động',
        preferences: ['Đi bộ', 'Tập yoga nhẹ'],
        age: 57,
        height: 168,
        weight: 72,
      },
      {
        userIdx: 10,
        health_goal: 'Phục hồi thể lực sau sinh',
        preferences: ['Đi bộ nhẹ', 'Ăn nhiều rau xanh'],
        age: 31,
        height: 159,
        weight: 60,
      },
      {
        userIdx: 11,
        health_goal: 'Cải thiện sức bền',
        preferences: ['Chạy bộ đường dài', 'Bổ sung điện giải'],
        age: 43,
        height: 173,
        weight: 75,
      },
      {
        userIdx: 12,
        health_goal: 'Giảm căng thẳng công việc',
        preferences: ['Thiền định', 'Đi bộ buổi tối'],
        age: 29,
        height: 161,
        weight: 56,
      },
      {
        userIdx: 14,
        health_goal: 'Tăng cường sức khỏe tổng thể',
        preferences: ['Tập gym', 'Ngủ đủ giấc'],
        age: 36,
        height: 171,
        weight: 73,
      },
      {
        userIdx: 16,
        health_goal: 'Kiểm soát cholesterol',
        preferences: ['Ăn ít dầu mỡ', 'Đi bộ hàng ngày'],
        age: 50,
        height: 169,
        weight: 74,
      },
      {
        userIdx: 17,
        health_goal: 'Cải thiện linh hoạt cơ thể',
        preferences: ['Yoga', 'Giãn cơ mỗi sáng'],
        age: 41,
        height: 166,
        weight: 66,
      },
      {
        userIdx: 18,
        health_goal: 'Xây dựng thói quen ăn uống lành mạnh',
        preferences: ['Ăn nhiều rau xanh', 'Hạn chế đồ ngọt'],
        age: 27,
        height: 157,
        weight: 52,
      },
    ];

    for (const cp of coachProfiles) {
      const user = newPatientUsers[cp.userIdx] ?? allPatientUsers[cp.userIdx];
      const createdAt = toDateStr(addDays(today, -randomInt(2, 60)));
      const rows: { id: number }[] = await queryRunner.query(
        `
          INSERT INTO "coach_profile" ("display_name","health_goal","preferences","age","height","weight","user_id","created_at","updated_at")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
          RETURNING id
        `,
        [
          user.fullname,
          cp.health_goal,
          cp.preferences.join(','),
          cp.age,
          cp.height,
          cp.weight,
          user.id,
          createdAt,
        ],
      );
      await queryRunner.query(
        `
          INSERT INTO "audit_log" ("action","entity_name","new_data","endpoint","method","status_code","is_success","duration_ms","user_id","created_at","updated_at")
          VALUES ('CREATE','coach-profile',$1,'/api/v1/coach-profile','POST',201,true,$2,$3,$4,$4)
        `,
        [
          JSON.stringify({ id: rows[0].id, health_goal: cp.health_goal }),
          randomInt(40, 260),
          user.id,
          createdAt,
        ],
      );
      if (Math.random() < 0.4) {
        const updatedAt = toDateStr(
          addDays(new Date(`${createdAt}T00:00:00`), randomInt(3, 30)),
        );
        await queryRunner.query(
          `
            INSERT INTO "audit_log" ("action","entity_name","new_data","endpoint","method","status_code","is_success","duration_ms","user_id","created_at","updated_at")
            VALUES ('UPDATE','coach-profile',$1,'/api/v1/coach-profile','PATCH',200,true,$2,$3,$4,$4)
          `,
          [
            JSON.stringify({
              id: rows[0].id,
              weight: cp.weight + randomInt(-3, 3),
            }),
            randomInt(40, 260),
            user.id,
            updatedAt,
          ],
        );
      }
    }

    // ---------------------------------------------------------------
    // 10. Channels + messages — patient/doctor đã có appointment chung
    // ---------------------------------------------------------------
    const pairKey = (userId: number, doctorId: number) =>
      `${userId}|${doctorId}`;
    const seenPairs = new Set<string>();

    const doctorUserIdByDoctorId = new Map<number, number>();
    const doctorUserRows: { id: number; user_id: number }[] =
      await queryRunner.query(`SELECT id, user_id FROM "doctors"`);
    for (const d of doctorUserRows) doctorUserIdByDoctorId.set(d.id, d.user_id);

    const conversationTemplates = [
      [
        'Chào bác sĩ, em muốn hỏi thêm về kết quả khám hôm trước ạ.',
        'Chào bạn, bạn cứ hỏi thoải mái nhé.',
        'Em thấy vẫn còn hơi đau, có cần tái khám sớm không ạ?',
        'Nếu triệu chứng không giảm sau 3 ngày thì nên tái khám lại nhé.',
      ],
      [
        'Bác sĩ ơi, đơn thuốc em nên uống trước hay sau ăn ạ?',
        'Bạn uống sau ăn khoảng 30 phút nhé.',
        'Dạ em cảm ơn bác sĩ ạ.',
      ],
      [
        'Chào bác sĩ, lịch hẹn tuần sau em có thể đổi sang buổi chiều được không ạ?',
        'Được bạn nhé, bạn vào mục lịch hẹn để đổi khung giờ giúp mình.',
        'Dạ em cảm ơn bác sĩ.',
      ],
      [
        'Bác sĩ cho em hỏi triệu chứng này có nghiêm trọng không ạ?',
        'Bạn mô tả kỹ hơn giúp mình được không?',
        'Em bị đau âm ỉ khoảng 2 ngày nay ạ.',
        'Bạn nên đến khám trực tiếp để mình kiểm tra kỹ hơn nhé.',
      ],
      [
        'Chào bác sĩ, cảm ơn bác sĩ đã tư vấn nhiệt tình hôm qua.',
        'Không có gì, chúc bạn mau khỏe nhé!',
      ],
    ];

    let convCount = 0;
    for (const appt of createdAppointments) {
      if (convCount >= 10) break;
      const doctorUserId = doctorUserIdByDoctorId.get(appt.doctor_id);
      if (!doctorUserId) continue;
      const key = pairKey(appt.user_id, doctorUserId);
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const channelRows: { id: number }[] = await queryRunner.query(
        `INSERT INTO "channels" DEFAULT VALUES RETURNING id`,
      );
      const channelId = channelRows[0].id;
      await queryRunner.query(
        `INSERT INTO "channel_members" ("participant_id","channel_id") VALUES ($1,$2)`,
        [appt.user_id, channelId],
      );
      await queryRunner.query(
        `INSERT INTO "channel_members" ("participant_id","channel_id") VALUES ($1,$2)`,
        [doctorUserId, channelId],
      );

      const conversation = pick(conversationTemplates);
      for (let i = 0; i < conversation.length; i++) {
        const sender = i % 2 === 0 ? appt.user_id : doctorUserId;
        await queryRunner.query(
          `
            INSERT INTO "messages" ("message_type","content","is_read","sender_id","channel_id","created_at","updated_at")
            VALUES ('regular',$1,$2,$3,$4,now(),now())
          `,
          [encrypt(conversation[i]), Math.random() < 0.75, sender, channelId],
        );
      }
      convCount++;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const newPatientEmails = [
      'dinhthikieuoanh@gmail.com',
      'buiquangvinh@gmail.com',
      'ngothithuthao@yahoo.com',
      'phanminhtri@gmail.com',
      'duongthingocanh@gmail.com',
      'vohoangphuc@gmail.com',
      'hoangthanhthuy@yahoo.com',
      'nguyentrongkhang@gmail.com',
      'lamthihoaimy@gmail.com',
      'truongvanhung@yahoo.com',
      'chauthidiemquynh@gmail.com',
      'lyminhkhoa@gmail.com',
      'daothilinhchi@gmail.com',
      'huynhcongthanh@yahoo.com',
      'maithixuanmai@gmail.com',
      'dangvantoan@gmail.com',
      'buithithanhtam@gmail.com',
      'trinhquangduc@yahoo.com',
      'phamthihuongly@gmail.com',
      'nguyenductoan@gmail.com',
    ];

    // Toàn bộ dữ liệu do migration này tạo đều truy vết được về đúng 20
    // user email tĩnh ở trên (users → relatives → appointments → ...) —
    // mọi DELETE dưới đây đều scope qua danh sách này, không bao giờ xoá
    // theo kiểu "xoá cả bảng", để không đụng tới dữ liệu thật/e2e-test đã
    // tồn tại từ trước khi migration này chạy.
    const newUserIdsSubquery = `SELECT "id" FROM "users" WHERE "email" = ANY($1::text[])`;
    const relativeIdsSubquery = `SELECT "id" FROM "relatives" WHERE "user_id" IN (${newUserIdsSubquery})`;
    const appointmentIdsSubquery = `SELECT "id" FROM "appointments" WHERE "patient_id" IN (${relativeIdsSubquery})`;

    await queryRunner.query(
      `DELETE FROM "messages" WHERE "channel_id" IN (SELECT "channel_id" FROM "channel_members" WHERE "participant_id" IN (${newUserIdsSubquery}))`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "channels" WHERE "id" IN (SELECT "channel_id" FROM "channel_members" WHERE "participant_id" IN (${newUserIdsSubquery}))`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "channel_members" WHERE "participant_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "audit_log" WHERE "entity_name" = 'coach-profile' AND "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "coach_profile" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "complaints" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "notifications" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "satisfaction_rating" WHERE "appointment_id" IN (${appointmentIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "examination_result" WHERE "appointment_id" IN (${appointmentIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "appointments" WHERE "patient_id" IN (${relativeIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "health_profile" WHERE "relative_id" IN (${relativeIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "relatives" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "user_settings" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "user_roles" WHERE "user_id" IN (${newUserIdsSubquery})`,
      [newPatientEmails],
    );
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = ANY($1::text[])`,
      [newPatientEmails],
    );
  }
}
