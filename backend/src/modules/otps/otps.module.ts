import { Module } from '@nestjs/common';
import { OtpsService } from './otps.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpsController } from './otps.controller';
import Otp from 'src/entities/otp.entity';
import ResetToken from 'src/entities/resetToken.entity';
import { UsersModule } from '../users/users.module';
import { BullmqModule } from 'src/bullmq/bullmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Otp, ResetToken]),
    UsersModule,
    BullmqModule,
  ],
  providers: [OtpsService],
  exports: [OtpsService],
  controllers: [OtpsController],
})
export class OtpsModule {}
