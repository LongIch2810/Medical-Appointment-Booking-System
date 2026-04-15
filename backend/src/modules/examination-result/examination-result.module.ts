import { Module } from '@nestjs/common';
import { ExaminationResultController } from './examination-result.controller';
import { ExaminationResultService } from './examination-result.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import ExaminationResult from 'src/entities/examinationResult.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { RelativesModule } from '../relatives/relatives.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExaminationResult]),
    RedisCacheModule,
    AppointmentsModule,
    RelativesModule,
    UsersModule,
  ],
  controllers: [ExaminationResultController],
  providers: [ExaminationResultService],
  exports: [ExaminationResultService],
})
export class ExaminationResultModule {}
