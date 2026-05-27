"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TopicMapper", {
    enumerable: true,
    get: function() {
        return TopicMapper;
    }
});
const _classtransformer = require("class-transformer");
const _topicResponsedto = require("./dto/response/topicResponse.dto");
let TopicMapper = class TopicMapper {
    static toTopicResponse(topic) {
        return (0, _classtransformer.plainToInstance)(_topicResponsedto.TopicResponseDto, topic, {
            excludeExtraneousValues: true
        });
    }
    static toTopicListResponse(topics) {
        return (0, _classtransformer.plainToInstance)(_topicResponsedto.TopicResponseDto, topics, {
            excludeExtraneousValues: true
        });
    }
};

//# sourceMappingURL=topic.mapper.js.map