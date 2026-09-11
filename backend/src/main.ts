import { NestFactory } from '@nestjs/core';
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
    .addCookieAuth('accessToken')
    .build();
  // Keep the generated metadata path static so Vercel's file tracer includes
  // dist/src/metadata.js in the deployed serverless function.
  const { default: swaggerMetadata } = require('./metadata.js');
  await SwaggerModule.loadPluginMetadata(swaggerMetadata);
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();
