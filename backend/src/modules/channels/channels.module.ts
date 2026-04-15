import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Channel from 'src/entities/channel.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Channel]), UsersModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
