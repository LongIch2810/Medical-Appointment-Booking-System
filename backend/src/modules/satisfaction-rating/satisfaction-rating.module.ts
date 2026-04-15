import { Module } from '@nestjs/common';
import { SatisfactionRatingController } from './satisfaction-rating.controller';
import { SatisfactionRatingService } from './satisfaction-rating.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import SatisfactionRating from 'src/entities/satisfactionRating.entity';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [TypeOrmModule.forFeature([SatisfactionRating]), AppointmentsModule],
  controllers: [SatisfactionRatingController],
  providers: [SatisfactionRatingService],
  exports: [SatisfactionRatingService],
})
export class SatisfactionRatingModule {}
