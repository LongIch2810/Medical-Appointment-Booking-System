import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Relationship from 'src/entities/relationship.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { BodyCreateRelationshipDto } from './dto/request/bodyCreateRelationship.dto';
import { BodyFilterRelationshipsDto } from './dto/request/bodyFilterRelationships.dto';
import { RelationshipsMapper } from './relationships.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { BodyUpdateRelationshipDto } from './dto/request/bodyUpdateRelationship.dto';

@Injectable()
export class RelationshipsService {
  constructor(
    @InjectRepository(Relationship)
    private readonly relationshipRepo: Repository<Relationship>,
  ) {}

  async create(body: BodyCreateRelationshipDto) {
    try {
      const { relationship_code, relationship_name } = body;
      const isRelationshipExistsByName =
        await this.isRelationshipExistsByName(relationship_name);
      const isRelationshipExistsByCode =
        await this.isRelationshipExistsByCode(relationship_code);

      if (isRelationshipExistsByName || isRelationshipExistsByCode) {
        throw new ConflictException('Mối quan hệ đã tồn tại.');
      }

      const createdRelationship = this.relationshipRepo.create(body);
      const newRelationship =
        await this.relationshipRepo.save(createdRelationship);
      return RelationshipsMapper.toRelationshipResponseDto(newRelationship);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Mối quan hệ đã tồn tại.');
      }
      throw error;
    }
  }

  async update(
    relationshipCode: string,
    bodyUpdateRelationship: BodyUpdateRelationshipDto,
  ) {
    const relationship = await this.findByRelationshipCode(relationshipCode);

    if (
      bodyUpdateRelationship.relationship_name !== undefined &&
      bodyUpdateRelationship.relationship_name !==
        relationship.relationship_name
    ) {
      const existedRelationship = await this.relationshipRepo
        .createQueryBuilder('relationship')
        .where('LOWER(relationship.relationship_name) = LOWER(:name)', {
          name: bodyUpdateRelationship.relationship_name,
        })
        .andWhere('relationship.relationship_code != :relationshipCode', {
          relationshipCode,
        })
        .getOne();

      if (existedRelationship) {
        throw new ConflictException('Mối quan hệ đã tồn tại.');
      }

      relationship.relationship_name = bodyUpdateRelationship.relationship_name;
    }

    if (bodyUpdateRelationship.description !== undefined) {
      relationship.description = bodyUpdateRelationship.description;
    }

    const updatedRelationship = await this.relationshipRepo.save(relationship);
    return RelationshipsMapper.toRelationshipResponseDto(updatedRelationship);
  }

  async remove(relationshipCode: string) {
    await this.findByRelationshipCode(relationshipCode);
    await this.relationshipRepo.softDelete({
      relationship_code: relationshipCode,
    });
    return { message: 'Xóa mối quan hệ thành công.' };
  }

  async getRelationshipDetail(relationshipCode: string) {
    const relationship = await this.relationshipRepo.findOne({
      where: { relationship_code: relationshipCode },
    });
    if (!relationship) {
      throw new NotFoundException('Không tìm thấy mối quan hệ');
    }
    return RelationshipsMapper.toRelationshipResponseDto(relationship);
  }

  async filterAndPagination(objectFilters: BodyFilterRelationshipsDto) {
    let { search, arrange, page, limit } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    const query = this.relationshipRepo
      .createQueryBuilder('relationship')
      .orderBy(
        'relationship.relationship_name',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (search) {
      query.where('relationship.relationship_name ILIKE :search', {
        search: `%${search}%`,
      });
      query.orWhere('relationship.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [relationships, total] = await query.getManyAndCount();
    const result = new PaginationResultDto(
      'relationships',
      RelationshipsMapper.toRelationshipResponseDtoList(relationships),
      total,
      page,
      limit,
    );
    return result;
  }

  async findByRelationshipCode(relationshipCode: string) {
    const relationship = await this.relationshipRepo.findOne({
      where: { relationship_code: relationshipCode },
    });
    if (!relationship) {
      throw new NotFoundException('Không tìm thấy mối quan hệ');
    }
    return relationship;
  }

  async isRelationshipExistsByName(relationship_name: string) {
    const relationship = await this.relationshipRepo.findOne({
      where: { relationship_name },
    });
    return !!relationship;
  }

  async isRelationshipExistsByCode(relationship_code: string) {
    const relationship = await this.relationshipRepo.findOne({
      where: { relationship_code },
    });
    return !!relationship;
  }
}
