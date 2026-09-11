import { DataSource } from 'typeorm';

/**
 * Bảng thuần transactional, KHÔNG có dữ liệu seed cố định nào (roles/
 * permissions/specialties/users mẫu không đụng tới các bảng này) — an toàn
 * để TRUNCATE toàn bộ giữa các test file. Xác nhận tên bảng thật từ
 * `1779637936560-createTables.ts` (không suy đoán).
 */
export const SAFE_TO_TRUNCATE_TABLES = [
  'audit_log',
  'otps',
  'conversation',
  'messages_attachments',
  'messages',
  'channel_members',
  'channels',
  'complaints',
] as const;

/**
 * TRUNCATE ... RESTART IDENTITY CASCADE cho các bảng rỗng-sau-seed. Không
 * bao giờ gọi hàm này với bảng có seed cố định (roles/permissions/
 * role_permissions/specialties/users/doctors/doctor_schedules/
 * relationships/articles/topics/tags/migrations).
 */
export async function truncateTransactionalTables(
  dataSource: DataSource,
  tables: readonly string[] = SAFE_TO_TRUNCATE_TABLES,
): Promise<void> {
  if (tables.length === 0) return;
  const identifiers = tables.map((t) => `"${t}"`).join(', ');
  await dataSource.query(
    `TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`,
  );
}

/**
 * Xoá có chọn lọc theo id — dùng cho bảng có seed cố định (users, relatives,
 * health_profile, appointments, notifications, user_roles, ...) mà test
 * KHÔNG được truncate nguyên bảng. Caller tự chịu trách nhiệm gọi theo đúng
 * thứ tự tôn trọng FK (bảng con trước bảng cha).
 */
export async function deleteByIds(
  dataSource: DataSource,
  table: string,
  ids: Array<number | string>,
): Promise<void> {
  if (ids.length === 0) return;
  await dataSource.query(`DELETE FROM "${table}" WHERE id = ANY($1)`, [ids]);
}
