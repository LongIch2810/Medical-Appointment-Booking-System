import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import AiAdminReport from 'src/entities/aiAdminReport.entity';
import { AiDocumentsModule } from '../ai-documents/ai-documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiAdminReport]), AiDocumentsModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService],
})
export class AdminReportsModule {}
