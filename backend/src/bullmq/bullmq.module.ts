import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProducer } from './queues/email/email.producer';
import { EmailProcessor } from './queues/email/email.processor';
import { MailModule } from 'src/mail/mail.module';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { WebsocketModule } from 'src/websockets/websoket.module';
import { UploadFileProcessor } from './queues/uploadFile/uploadFile.processor';
import { UploadFileProducer } from './queues/uploadFile/uploadFile.producer';
import { CloudinaryModule } from 'src/uploads/cloudinary.module';
import { MessagesModule } from 'src/modules/messages/messages.module';
import { ArticlesModule } from 'src/modules/articles/articles.module';
import { AuditLogsModule } from 'src/modules/audit-logs/audit-logs.module';
import { AuditLogsProcessor } from './queues/auditLogs/auditLogs.processor';
import { AuditLogsProducer } from './queues/auditLogs/auditLogs.producer';

@Module({
  imports: [
    MailModule,
    forwardRef(() => AppointmentsModule),
    forwardRef(() => CloudinaryModule),
    AuditLogsModule,
    WebsocketModule,
    MessagesModule,
    ArticlesModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: 1,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'email-queue' }),
    BullModule.registerQueue({ name: 'upload-file-queue' }),
    BullModule.registerQueue({ name: 'audit-logs-queue' }),
  ],
  providers: [
    EmailProducer,
    EmailProcessor,
    AuditLogsProcessor,
    AuditLogsProducer,
    UploadFileProcessor,
    UploadFileProducer,
  ],
  exports: [EmailProducer, UploadFileProducer, AuditLogsProducer],
})
export class BullmqModule {}
