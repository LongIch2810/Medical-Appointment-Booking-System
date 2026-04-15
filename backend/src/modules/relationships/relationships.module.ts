import { Module } from '@nestjs/common';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Relationship from 'src/entities/relationship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Relationship])],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
