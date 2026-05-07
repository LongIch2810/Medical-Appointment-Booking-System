import { forwardRef, Module } from '@nestjs/common';
import { RelativesController } from './relatives.controller';
import { RelativesService } from './relatives.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Relative from 'src/entities/relative.entity';
import { UsersModule } from '../users/users.module';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
  imports: [TypeOrmModule.forFeature([Relative]), forwardRef(() => UsersModule), RelationshipsModule],
  controllers: [RelativesController],
  providers: [RelativesService],
  exports: [RelativesService],
})
export class RelativesModule { }
