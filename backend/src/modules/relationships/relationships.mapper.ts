import { plainToInstance } from 'class-transformer';
import Relationship from 'src/entities/relationship.entity';
import { RelationshipResponseDto } from './dto/response/relationshipResponse.dto';

export class RelationshipsMapper {
  static toRelationshipResponseDto(
    relationship: Relationship,
  ): RelationshipResponseDto {
    return plainToInstance(RelationshipResponseDto, relationship, {
      excludeExtraneousValues: true,
    });
  }

  static toRelationshipResponseDtoList(
    relationships: Relationship[],
  ): RelationshipResponseDto[] {
    return plainToInstance(RelationshipResponseDto, relationships, {
      excludeExtraneousValues: true,
    });
  }
}
