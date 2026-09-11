import { Module } from '@nestjs/common';
import { CoachProfileController } from './coach-profile.controller';
import { CoachProfileService } from './coach-profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import CoachProfile from 'src/entities/coachProfile.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoachProfile]),
    RedisCacheModule,
    UsersModule,
  ],
  controllers: [CoachProfileController],
  providers: [CoachProfileService],
  exports: [CoachProfileService],
})
export class CoachProfileModule {}
