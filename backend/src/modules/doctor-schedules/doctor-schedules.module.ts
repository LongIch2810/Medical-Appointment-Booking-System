import { Module } from '@nestjs/common';
import { DoctorSchedulesController } from './doctor-schedules.controller';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import Doctor from 'src/entities/doctor.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorSchedule]),
    DoctorsModule,
    RedisCacheModule,
  ],
  controllers: [DoctorSchedulesController],
  providers: [DoctorSchedulesService],
  exports: [DoctorSchedulesService],
})
export class DoctorSchedulesModule {}
