import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import Role from 'src/entities/role.entity';
import UserRole from 'src/entities/userRole.entity';
import { ROLE_NAME } from 'src/utils/constants';

/**
 * User PATIENT thật, có sẵn từ migration seed
 * (1787000000000-seedTransactionalData.ts) — password plaintext xác định
 * được từ chính migration ("Patient@123"), không phải giá trị bịa ra.
 * KHÔNG xoá user này trong bất kỳ bước cleanup nào (nó là marker
 * idempotency của chính migration đó).
 */
export const PATIENT_FIXTURE = {
  email: 'dinhthikieuoanh@gmail.com',
  password: 'Patient@123',
};

export interface LoginResult {
  cookieHeader: string;
  accessToken: string;
  refreshToken: string;
}

function extractCookies(setCookieHeader: string[] | undefined): {
  cookieHeader: string;
  accessToken: string;
  refreshToken: string;
} {
  const cookies = setCookieHeader ?? [];
  const find = (name: string) => {
    const raw = cookies.find((c) => c.startsWith(`${name}=`));
    if (!raw) {
      throw new Error(`Không tìm thấy cookie "${name}" trong response login.`);
    }
    return raw.split(';')[0].split('=')[1];
  };
  return {
    cookieHeader: cookies.map((c) => c.split(';')[0]).join('; '),
    accessToken: find('accessToken'),
    refreshToken: find('refreshToken'),
  };
}

/** Đăng nhập thật qua endpoint thật, trả cookie dùng cho các request sau. */
export async function loginAs(
  app: INestApplication,
  credentials: { email: string; password: string },
  endpoint: '/api/v1/auth/login' | '/api/v1/auth/admin/login' = '/api/v1/auth/login',
): Promise<LoginResult> {
  const response = await request(app.getHttpServer())
    .post(endpoint)
    .send({ usernameOrEmail: credentials.email, password: credentials.password })
    .expect(200);

  return extractCookies(response.headers['set-cookie'] as unknown as string[]);
}

export interface RegisteredUser {
  userId: number;
  email: string;
  username: string;
  password: string;
}

let registerCounter = 0;

/**
 * Đăng ký một user PATIENT mới thật qua POST /auth/register (tạo User +
 * role PATIENT + Relative "bản thân" + HealthProfile rỗng qua đúng luồng
 * production thật). Trả về id để caller tự cleanup theo id trong afterEach
 * (không truncate nguyên bảng users).
 */
export async function registerNewUser(
  app: INestApplication,
  dataSource: DataSource,
): Promise<RegisteredUser> {
  registerCounter += 1;
  const suffix = `${Date.now()}_${registerCounter}`;
  const email = `it_test_user_${suffix}@example.com`;
  const username = `it_test_user_${suffix}`;
  const password = 'Test@12345';

  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ username, email, password, fullname: 'Integration Test User' })
    .expect(201);

  const rows = await dataSource.query<{ id: number }[]>(
    'SELECT id FROM "users" WHERE email = $1',
    [email],
  );
  if (rows.length === 0) {
    throw new Error(`registerNewUser: không tìm thấy user vừa tạo (${email}).`);
  }

  return { userId: rows[0].id, email, username, password };
}

/**
 * Đăng ký user PATIENT mới rồi GÁN THÊM (không xoá role PATIENT mặc định)
 * role ADMIN/DOCTOR qua repository thật, để có tài khoản thật có quyền thật
 * (từ rolePermissionMap seed sẵn) dùng cho test permission-guarded endpoint.
 */
export async function registerAndPromote(
  app: INestApplication,
  dataSource: DataSource,
  roleName: typeof ROLE_NAME.ADMIN | typeof ROLE_NAME.DOCTOR,
): Promise<RegisteredUser> {
  const user = await registerNewUser(app, dataSource);

  const roleRepo = dataSource.getRepository(Role);
  const role = await roleRepo.findOne({ where: { role_name: roleName } });
  if (!role) {
    throw new Error(
      `registerAndPromote: role "${roleName}" không tồn tại trong DB test (kiểm tra migration seed).`,
    );
  }

  const userRoleRepo = dataSource.getRepository(UserRole);
  await userRoleRepo.save(
    userRoleRepo.create({ user: { id: user.userId }, role: { id: role.id } }),
  );

  return user;
}

/** Xoá đúng các row do registerNewUser/registerAndPromote tạo ra, theo thứ tự tôn trọng FK. */
export async function cleanupRegisteredUsers(
  dataSource: DataSource,
  userIds: number[],
): Promise<void> {
  if (userIds.length === 0) return;
  // notifications/user_settings: luồng đặt lịch thật (enqueueAppointmentEmailSafely
  // -> SettingsService.getOrCreateUserSetting, createAppointmentNotifications)
  // có thể tự tạo thêm 2 bảng này cho patient — phải dọn trước khi xoá users
  // để không vi phạm FK, dù caller không trực tiếp track id của chúng.
  await dataSource.query('DELETE FROM "notifications" WHERE user_id = ANY($1)', [
    userIds,
  ]);
  await dataSource.query(
    'DELETE FROM "user_settings" WHERE user_id = ANY($1)',
    [userIds],
  );
  await dataSource.query(
    'DELETE FROM "health_profile" WHERE relative_id IN (SELECT id FROM "relatives" WHERE user_id = ANY($1))',
    [userIds],
  );
  await dataSource.query('DELETE FROM "relatives" WHERE user_id = ANY($1)', [
    userIds,
  ]);
  await dataSource.query('DELETE FROM "user_roles" WHERE user_id = ANY($1)', [
    userIds,
  ]);
  await dataSource.query('DELETE FROM "users" WHERE id = ANY($1)', [userIds]);
}
