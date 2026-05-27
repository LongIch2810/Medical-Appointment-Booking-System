import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('topics')
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getTopics(@Body() bodyFilterTopics: BodyFilterTopicsDto) {
    return this.topicsService.filterAndPagination(bodyFilterTopics);
  }

  @Post('create-topic')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.TOPIC_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'topics' })
  async createTopic(@Body() bodyCreateTopic: BodyCreateTopicDto) {
    return this.topicsService.create(bodyCreateTopic);
  }

  @Get(':topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.TOPIC_READ)
  async getTopicDetail(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.topicsService.findById(topicId);
  }

  @Patch(':topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.TOPIC_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'topics' })
  async updateTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() bodyUpdateTopic: BodyUpdateTopicDto,
  ) {
    return this.topicsService.update(topicId, bodyUpdateTopic);
  }

  @Delete(':topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.TOPIC_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'topics' })
  async deleteTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.topicsService.remove(topicId);
  }
}
