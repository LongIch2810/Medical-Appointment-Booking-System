import { forwardRef, Module } from '@nestjs/common';
import { SpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { CloudinaryModule } from 'src/uploads/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Specialty]),
    RedisCacheModule,
    forwardRef(() => CloudinaryModule),
  ],
  controllers: [SpecialtiesController],
  providers: [SpecialtiesService],
  exports: [SpecialtiesService],
})
export class SpecialtiesModule {}
