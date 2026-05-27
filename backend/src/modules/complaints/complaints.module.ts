import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Complaint from 'src/entities/complaint.entity';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint])],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
