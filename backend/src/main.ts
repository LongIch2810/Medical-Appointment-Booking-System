import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RemoveFieldPasswordInterceptor } from './common/interceptors/removeFieldPassword.interceptor';
import { DateFormatInterceptor } from './common/interceptors/dateFormatInterceptor.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RATE_LIMIT_RESPONSE_HEADERS } from './common/rate-limit/rate-limit.constants';
import { parseTrustProxyHops } from './common/rate-limit/trust-proxy';
import { validateRequiredEnv } from './config/validateEnv';
import { AUTH_COOKIE_NAMES } from './utils/authContext';

async function bootstrap() {
  // Fail-fast trước khi bootstrap Nest — không đặt vào
  // ConfigModule.forRoot({validate}) vì việc đó biến giá trị đã validate
  // thành một snapshot có độ ưu tiên CAO HƠN process.env sống trong
  // ConfigService.get() (xem @nestjs/config ConfigService.get: internalConfig
  // -> validatedEnv -> process.env), phá vỡ các chỗ cố tình override
  // process.env lúc runtime (vd. test trỏ CHATBOT_URL sang mock server).
  validateRequiredEnv(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const trustProxyHops = parseTrustProxyHops(
    configService.get<string>('TRUST_PROXY_HOPS'),
  );
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      // Docker-mapped ports (docker-compose.dev.yml), used when running
      // docker compose alongside native `npm run dev` on the same machine
      'http://localhost:5183',
      'http://127.0.0.1:5183',
      'http://localhost:4183',
      'http://127.0.0.1:4183',
      'https://patientuilifehealth.vercel.app',
      'https://medical-appointment-booking-system-u75m.onrender.com',
      'https://adminmanagementuilifehealth.vercel.app',
    ],
    credentials: true,
    exposedHeaders: [...RATE_LIMIT_RESPONSE_HEADERS],
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'healthy', method: RequestMethod.GET },
    ],
  });
  app.useGlobalInterceptors(
    new RemoveFieldPasswordInterceptor(),
    new DateFormatInterceptor(),
    new ResponseInterceptor(),
    // new LoggingInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('System Booking Doctor')
    .setDescription('API cho hệ thống đặt lịch khám bác sĩ')
    .setVersion('1.0')
    .addCookieAuth(
      AUTH_COOKIE_NAMES.patient.access,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie access phụ thuộc context: patientAccessToken hoặc adminAccessToken; gửi thêm X-App-Context.',
      },
      'cookie',
    )
    .addCookieAuth(
      AUTH_COOKIE_NAMES.patient.access,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie access cho Patient. Khi dùng cookie, gửi thêm X-App-Context: patient.',
      },
      'patientAccessAuth',
    )
    .addCookieAuth(
      AUTH_COOKIE_NAMES.patient.refresh,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie refresh cho Patient. Khi dùng cookie, gửi thêm X-App-Context: patient.',
      },
      'patientRefreshAuth',
    )
    .addCookieAuth(
      AUTH_COOKIE_NAMES.admin.access,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie access cho Admin/Doctor. Khi dùng cookie, gửi thêm X-App-Context: admin.',
      },
      'adminAccessAuth',
    )
    .addCookieAuth(
      AUTH_COOKIE_NAMES.admin.refresh,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie refresh cho Admin/Doctor. Khi dùng cookie, gửi thêm X-App-Context: admin.',
      },
      'adminRefreshAuth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-App-Context',
        in: 'header',
        description:
          'Bắt buộc với browser cookie auth: patient hoặc admin. Bearer service-to-service có thể suy ra context từ claim appContext.',
      },
      'appContext',
    )
    .addGlobalParameters({
      name: 'X-App-Context',
      in: 'header',
      required: false,
      schema: { type: 'string', enum: ['patient', 'admin'] },
      description:
        'Bắt buộc khi xác thực bằng browser cookie; không bắt buộc khi dùng Bearer token.',
    })
    .build();
  // The Swagger CLI plugin generates this file during local builds, but
  // Vercel's serverless file tracer may omit it from the function bundle.
  // Swagger can still run without the generated metadata, so do not prevent
  // the API from starting when the optional file is unavailable.
  const swaggerMetadataPath = join(__dirname, 'metadata.js');
  if (existsSync(swaggerMetadataPath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: swaggerMetadata } = require('./metadata.js');
    await SwaggerModule.loadPluginMetadata(swaggerMetadata);
  } else {
    console.warn(
      '[startup] Swagger plugin metadata is unavailable; continuing without generated metadata.',
    );
  }
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();
