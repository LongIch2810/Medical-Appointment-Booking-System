import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { BullmqModule } from './bullmq/bullmq.module';
import { MailModule } from './mail/mail.module';
import { OtpsModule } from './modules/otps/otps.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatHistoryModule } from './modules/chat-history/chat-history.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { HealthProfileModule } from './modules/health-profile/health-profile.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { DoctorSchedulesModule } from './modules/doctor-schedules/doctor-schedules.module';
import { TopicsModule } from './modules/topics/topics.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { WebsocketModule } from './websockets/websoket.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { CloudinaryModule } from './uploads/cloudinary.module';
import { WsCookieAuthGuard } from './common/guards/wsCookieAuth.guard';
import { RelativesModule } from './modules/relatives/relatives.module';
import { ExaminationResultModule } from './modules/examination-result/examination-result.module';
import { TagsModule } from './modules/tags/tags.module';
import { SatisfactionRatingModule } from './modules/satisfaction-rating/satisfaction-rating.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    RedisCacheModule,
    AuthModule,
    DatabaseModule,
    UsersModule,
    BullmqModule,
    MailModule,
    OtpsModule,
    ChatHistoryModule,
    WebsocketModule,
    AppointmentsModule,
    DoctorsModule,
    HealthProfileModule,
    ArticlesModule,
    DoctorSchedulesModule,
    TopicsModule,
    SpecialtiesModule,
    RolesModule,
    PermissionsModule,
    RolePermissionModule,
    MessagesModule,
    ChannelsModule,
    CloudinaryModule,
    RelativesModule,
    ExaminationResultModule,
    TagsModule,
    SatisfactionRatingModule,
    AuditLogsModule,
    DashboardModule,
    RelationshipsModule,
  ],
})
export class AppModule {}
