import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTables1779637936560 } from './migrations/1779637936560-createTables';
import { SeedData1779638786395 } from './migrations/1779638786395-seedData';
import { CreateViews1779638801391 } from './migrations/1779638801391-createViews';
import { GrantChatbotReadonly1779638820330 } from './migrations/1779638820330-grantChatbotReadonly';
import { UpdateSequenceId1779638832258 } from './migrations/1779638832258-updateSequenceId';
import { AddComplaintResponse1779700000000 } from './migrations/1779700000000-addComplaintResponse';
import { GrantAdminAppointmentCreate1779800000000 } from './migrations/1779800000000-grantAdminAppointmentCreate';
import { AddAppointmentExpiredStatus1786530000000 } from './migrations/1786530000000-addAppointmentExpiredStatus';
import { AddUniqueDoctorScheduleDateIndex1786600000000 } from './migrations/1786600000000-addUniqueDoctorScheduleDateIndex';
import { CreateCoachProfile1786700000000 } from './migrations/1786700000000-createCoachProfile';
import { SeedCoachProfilePermission1786700000001 } from './migrations/1786700000001-seedCoachProfilePermission';
import { SeedAdminReportPermission1786800000000 } from './migrations/1786800000000-seedAdminReportPermission';
import { SeedEnterpriseReportPermission1786900000000 } from './migrations/1786900000000-seedEnterpriseReportPermission';
import { SeedTransactionalData1787000000000 } from './migrations/1787000000000-seedTransactionalData';
import { SeedAdminFullPermissions1787100000000 } from './migrations/1787100000000-seedAdminFullPermissions';
import { UpgradeNotificationsForRealtime1787200000000 } from './migrations/1787200000000-upgradeNotificationsForRealtime';
import { AddUserAndSystemSettings1787300000000 } from './migrations/1787300000000-addUserAndSystemSettings';
import { SecureChatbotReporting1787300000000 } from './migrations/1787300000000-secureChatbotReporting';
import { SecureOtpAndPasswordReset1787400000000 } from './migrations/1787400000000-secureOtpAndPasswordReset';
import { SeedMessageUpdatePermission1787500000000 } from './migrations/1787500000000-seedMessageUpdatePermission';
import { AddMessagingIndices1787500000001 } from './migrations/1787500000001-addMessagingIndices';

// Listed explicitly (not a glob) so Vercel's serverless file tracer, which
// only bundles statically imported files, actually includes these in the
// deployed function — a glob path here silently resolves to zero files in
// production and migrationsRun becomes a no-op.
const migrations = [
  CreateTables1779637936560,
  SeedData1779638786395,
  CreateViews1779638801391,
  GrantChatbotReadonly1779638820330,
  UpdateSequenceId1779638832258,
  AddComplaintResponse1779700000000,
  GrantAdminAppointmentCreate1779800000000,
  AddAppointmentExpiredStatus1786530000000,
  AddUniqueDoctorScheduleDateIndex1786600000000,
  CreateCoachProfile1786700000000,
  SeedCoachProfilePermission1786700000001,
  SeedAdminReportPermission1786800000000,
  SeedEnterpriseReportPermission1786900000000,
  SeedTransactionalData1787000000000,
  SeedAdminFullPermissions1787100000000,
  UpgradeNotificationsForRealtime1787200000000,
  AddUserAndSystemSettings1787300000000,
  SecureChatbotReporting1787300000000,
  SecureOtpAndPasswordReset1787400000000,
  SeedMessageUpdatePermission1787500000000,
  AddMessagingIndices1787500000001,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
        migrations,
        // On Vercel, migrations already ran during the build step (see the
        // "vercel-build" npm script) — running them again here would repeat
        // that same work inside the request-serving function, which risks
        // exceeding its execution timeout on a large pending batch and
        // crash-looping every cold start. Locally/Docker (no VERCEL env var)
        // keep running them at boot for the usual auto-migrate-on-start dev
        // flow.
        migrationsRun: process.env.VERCEL !== '1',
        synchronize: false,
        autoLoadEntities: true,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
