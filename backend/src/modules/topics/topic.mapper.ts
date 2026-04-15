import { plainToInstance } from 'class-transformer';
import Topic from 'src/entities/topic.entity';
import { TopicResponseDto } from './dto/response/topicResponse.dto';

export class TopicMapper {
  static toTopicResponse(topic: Topic): TopicResponseDto {
    return plainToInstance(TopicResponseDto, topic, {
      excludeExtraneousValues: true,
    });
  }

  static toTopicListResponse(topics: Topic[]): TopicResponseDto[] {
    return plainToInstance(TopicResponseDto, topics, {
      excludeExtraneousValues: true,
    });
  }
}
