import { Module } from '@nestjs/common';
import { SatisfactionRatingController } from './satisfaction-rating.controller';
import { SatisfactionRatingService } from './satisfaction-rating.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import SatisfactionRating from 'src/entities/satisfactionRating.entity';
import { AppointmentsModule } from '../appointments/appointments.module';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SatisfactionRating]),
    AppointmentsModule,
    RedisCacheModule,
  ],
  controllers: [SatisfactionRatingController],
  providers: [SatisfactionRatingService],
  exports: [SatisfactionRatingService],
})
export class SatisfactionRatingModule {}
