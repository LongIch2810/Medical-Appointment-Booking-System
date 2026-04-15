import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { TopicsService } from './topics.service';
import { BodyCreateTopicDto } from './dto/request/bodyCreateTopic.dto';
import { BodyFilterTopicsDto } from './dto/request/bodyFilterTopics.dto';
import { BodyUpdateTopicDto } from './dto/request/bodyUpdateTopic.dto';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post()
  async getTopics(@Body() bodyFilterTopics: BodyFilterTopicsDto) {
    return this.topicsService.filterAndPagination(bodyFilterTopics);
  }

  @Post('create-topic')
  async createTopic(@Body() bodyCreateTopic: BodyCreateTopicDto) {
    return this.topicsService.create(bodyCreateTopic);
  }

  @Get(':topicId')
  async getTopicDetail(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.topicsService.findById(topicId);
  }

  @Patch(':topicId')
  async updateTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() bodyUpdateTopic: BodyUpdateTopicDto,
  ) {
    return this.topicsService.update(topicId, bodyUpdateTopic);
  }

  @Delete(':topicId')
  async deleteTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.topicsService.remove(topicId);
  }
}
