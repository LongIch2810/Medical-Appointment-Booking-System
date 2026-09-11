import * as dotenv from 'dotenv';
import * as path from 'path';

// Chạy trước khi MỖI file integration-spec được require — nạp .env.test vào
// process.env TRƯỚC KHI AppModule (và ConfigModule.forRoot() bên trong nó)
// được import ở bất kỳ đâu trong file test. dotenv.config() mặc định KHÔNG
// ghi đè biến đã có sẵn trong process.env, nên khi ConfigModule sau đó tự
// load lại `.env` (giá trị dev thật), các giá trị test đã set từ đây được
// giữ nguyên, không bị ghi đè.
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

const dbName = process.env.DB_NAME;
if (!dbName || !dbName.endsWith('_test')) {
  throw new Error(
    `An toàn: DB_NAME phải kết thúc bằng "_test" trước khi chạy integration test (hiện tại: ${String(dbName)}). Kiểm tra backend/.env.test.`,
  );
}

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    `An toàn: NODE_ENV phải là "test" khi chạy integration test (hiện tại: ${String(process.env.NODE_ENV)}).`,
  );
}

jest.setTimeout(30000);
