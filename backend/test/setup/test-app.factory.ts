import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// require() thay vì `import cookieParser from 'cookie-parser'`: main.ts dùng
// default-import và chạy đúng qua SWC (build production), nhưng ts-jest biên
// dịch bằng tsc thường (esModuleInterop=false trong tsconfig.json) khiến
// default-import ra `undefined` với module CommonJS thuần như cookie-parser.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { AppModule } from 'src/app.module';
import { RemoveFieldPasswordInterceptor } from 'src/common/interceptors/removeFieldPassword.interceptor';
import { DateFormatInterceptor } from 'src/common/interceptors/dateFormatInterceptor.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { AuditLogsProducer } from 'src/bullmq/queues/auditLogs/auditLogs.producer';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { EmailProcessor } from 'src/bullmq/queues/email/email.processor';
import { AuditLogsProcessor } from 'src/bullmq/queues/auditLogs/auditLogs.processor';
import { UploadFileProcessor } from 'src/bullmq/queues/uploadFile/uploadFile.processor';
import { DataSource } from 'typeorm';
import { FakeRedisCacheService } from './fakeRedisCacheService';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';

/**
 * Boostrap toàn bộ AppModule thật cho integration test, áp lại đúng chuỗi
 * global pipe/filter/interceptor mà backend/src/main.ts áp dụng khi chạy
 * thật (trừ phần Swagger metadata loading — build artifact không tồn tại
 * khi chạy qua ts-jest — và app.listen(), test dùng app.init() + supertest
 * trên app.getHttpServer() thay vì mở cổng mạng thật).
 *
 * Override các provider sau, đúng ranh giới "external boundary":
 *  - RedisCacheService: fake in-memory (xem fakeRedisCacheService.ts).
 *  - EmailProducer/AuditLogsProducer/UploadFileProducer: stub không
 *    enqueue job thật.
 *  - EmailProcessor/AuditLogsProcessor/UploadFileProcessor: stub (object
 *    rỗng, không mang metadata @Processor) để @nestjs/bullmq KHÔNG khởi
 *    tạo Worker thật cho các queue này trong process test.
 *
 * Lý do quan trọng cho cả 2 nhóm override BullMQ ở trên: Redis dev
 * (docker-compose.dev.yml) hiện đang được backend-app (container dev thật)
 * dùng CHUNG cho BullMQ (db 1, cùng tên queue email-queue/audit-logs-queue/
 * upload-file-queue). Nếu không stub, process test này sẽ trở thành một
 * worker THẬT trên các queue đó — vừa có thể tự enqueue job thật (gửi email
 * thật, ghi audit log vào sai DB) vừa có thể "cướp" và xử lý nhầm job của
 * chính backend-app dev đang chạy thật (ghi audit log/side-effect của
 * request dev thật vào DB test thay vì DB dev). Postgres (DataSource thật,
 * trỏ DB test qua .env.test) không bị mock — đây chính là phần
 * "integration" thật sự của bộ test này.
 */
export interface TestApp {
  app: INestApplication;
  fakeRedisCacheService: FakeRedisCacheService;
  dataSource: DataSource;
}

export interface TestAppOptions {
  uploadFileProducer?: Pick<
    UploadFileProducer,
    'uploadFilesMessage' | 'uploadFilesArticle'
  >;
}

export async function createTestApp(
  options: TestAppOptions = {},
): Promise<TestApp> {
  const fakeRedisCacheService = new FakeRedisCacheService();
  const allowAllRateLimitStorage: ThrottlerStorage = {
    increment: jest.fn().mockResolvedValue({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    }),
  };
  const fakeEmailProducer: Pick<
    EmailProducer,
    'sendOtp' | 'sendWelcome' | 'sendAppointment'
  > = {
    sendOtp: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendAppointment: jest.fn().mockResolvedValue(undefined),
  };
  const fakeAuditLogsProducer: Pick<AuditLogsProducer, 'createAuditLog'> = {
    createAuditLog: jest.fn().mockResolvedValue(undefined),
  };
  const fakeUploadFileProducer: Pick<
    UploadFileProducer,
    'uploadFilesMessage' | 'uploadFilesArticle'
  > = {
    uploadFilesMessage: jest.fn().mockResolvedValue(undefined),
    uploadFilesArticle: jest.fn().mockResolvedValue(undefined),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RedisCacheService)
    .useValue(fakeRedisCacheService)
    .overrideProvider(RedisRateLimitStorage)
    .useValue(allowAllRateLimitStorage)
    .overrideProvider(EmailProducer)
    .useValue(fakeEmailProducer)
    .overrideProvider(AuditLogsProducer)
    .useValue(fakeAuditLogsProducer)
    .overrideProvider(UploadFileProducer)
    .useValue(options.uploadFileProducer ?? fakeUploadFileProducer)
    .overrideProvider(EmailProcessor)
    .useValue({})
    .overrideProvider(AuditLogsProcessor)
    .useValue({})
    .overrideProvider(UploadFileProcessor)
    .useValue({})
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(
    new RemoveFieldPasswordInterceptor(),
    new DateFormatInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  await app.init();

  const dataSource = app.get(DataSource);

  return { app, fakeRedisCacheService, dataSource };
}

/**
 * An toàn kép: không chỉ tin biến env DB_NAME mà còn tin chính connection
 * Postgres thật đang được app dùng — assert current_database() khớp DB test
 * trước khi bất kỳ test nào ghi dữ liệu.
 */
export async function assertConnectedToTestDatabase(
  dataSource: DataSource,
): Promise<void> {
  const expected = process.env.DB_NAME;
  const [{ current_database: actual }] = await dataSource.query<
    { current_database: string }[]
  >('SELECT current_database()');
  if (actual !== expected || !actual.endsWith('_test')) {
    throw new Error(
      `An toàn: app đang kết nối tới database "${actual}", không phải database test "${String(expected)}". Dừng test ngay để tránh ghi nhầm dữ liệu.`,
    );
  }
}
