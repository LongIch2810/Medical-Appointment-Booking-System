import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from 'src/entities/systemConfigs.entity';
import User from 'src/entities/user.entity';
import { UserSetting } from 'src/entities/userSetting.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SettingsService } from './settings.service';
import { SystemSettingsController } from './system-settings.controller';
import { UserSettingsController } from './user-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSetting, SystemConfig, User]),
    RedisCacheModule,
    forwardRef(() => AuditLogsModule),
  ],
  controllers: [UserSettingsController, SystemSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
