import { forwardRef, Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Article from 'src/entities/article.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { BullmqModule } from 'src/bullmq/bullmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article]),
    RedisCacheModule,
    forwardRef(() => BullmqModule),
  ],

  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
