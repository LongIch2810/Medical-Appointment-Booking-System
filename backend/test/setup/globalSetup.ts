import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';

/**
 * Chạy MỘT LẦN trước toàn bộ integration test suite, trong process riêng
 * (theo đúng cơ chế globalSetup của Jest — tách biệt với process chạy test
 * thật). Việc duy nhất cần làm ở đây là đảm bảo database test tồn tại; việc
 * chạy migration (tạo bảng + seed roles/permissions/users mẫu) được
 * `DatabaseModule` tự làm khi app bootstrap lần đầu (migrationsRun: true),
 * và idempotent an toàn khi bootstrap lại ở các file test sau (migration đã
 * áp dụng được TypeORM tự bỏ qua qua bảng `migrations`).
 */
export default async function globalSetup(): Promise<void> {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

  const dbName = process.env.DB_NAME;
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `backend/.env.test's DB_NAME phải kết thúc bằng "_test" để tránh chạy nhầm vào DB dev/production. Giá trị hiện tại: ${String(dbName)}`,
    );
  }

  // Kết nối vào DB mặc định của server Postgres (không phải DB test) để có
  // thể issue CREATE DATABASE cho DB test nếu nó chưa tồn tại.
  const maintenanceClient = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await maintenanceClient.connect();
  try {
    const existing = await maintenanceClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (existing.rowCount === 0) {
      // Tên DB đến từ .env.test do chính dự án kiểm soát (không phải input
      // người dùng cuối), nhưng vẫn escape identifier cho an toàn thay vì
      // nội suy chuỗi trực tiếp vào câu lệnh DDL.
      const safeName = dbName.replace(/"/g, '""');
      await maintenanceClient.query(`CREATE DATABASE "${safeName}"`);
      // eslint-disable-next-line no-console
      console.log(`[globalSetup] Đã tạo database test "${dbName}".`);
    }
  } finally {
    await maintenanceClient.end();
  }
}
