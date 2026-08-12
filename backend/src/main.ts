import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RemoveFieldPasswordInterceptor } from './common/interceptors/removeFieldPassword.interceptor';
import { DateFormatInterceptor } from './common/interceptors/dateFormatInterceptor.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
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
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
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
  const swaggerMetadataPath = './metadata.js';
  const { default: swaggerMetadata } = await import(swaggerMetadataPath);
  await SwaggerModule.loadPluginMetadata(swaggerMetadata);
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
bootstrap();
