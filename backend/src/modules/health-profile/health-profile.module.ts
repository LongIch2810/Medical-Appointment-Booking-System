import { Module } from '@nestjs/common';
import { HealthProfileController } from './health-profile.controller';
import { HealthProfileService } from './health-profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import HealthProfile from 'src/entities/healthProfile.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import Relative from 'src/entities/relative.entity';
import { RelativesModule } from '../relatives/relatives.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthProfile, Relative]),
    RedisCacheModule,
    RelativesModule,
    UsersModule,
  ],
  controllers: [HealthProfileController],
  providers: [HealthProfileService],
  exports: [HealthProfileService],
})
export class HealthProfileModule {}
