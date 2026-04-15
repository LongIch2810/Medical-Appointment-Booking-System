import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Appointment from 'src/entities/appointment.entity';
import Doctor from 'src/entities/doctor.entity';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import Relative from 'src/entities/relative.entity';
import { WebsocketModule } from 'src/websockets/websoket.module';
import User from 'src/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { DoctorSchedulesModule } from '../doctor-schedules/doctor-schedules.module';
import { RelativesModule } from '../relatives/relatives.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Relative,
      Doctor,
      DoctorSchedule,
      User,
    ]),
    forwardRef(() => UsersModule),
    RedisCacheModule,
    WebsocketModule,
    DoctorSchedulesModule,
    RelativesModule
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule { }
