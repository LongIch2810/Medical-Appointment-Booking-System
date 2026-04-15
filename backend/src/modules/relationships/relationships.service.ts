import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Relationship from 'src/entities/relationship.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { BodyCreateRelationshipDto } from './dto/request/bodyCreateRelationship.dto';
import { BodyFilterRelationshipsDto } from './dto/request/bodyFilterRelationships.dto';

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
      await this.relationshipRepo.save(createdRelationship);
      return { message: 'Tạo mối quan hệ thành công' };
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

  async update() {}

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
    const totalPages = Math.ceil(total / limit);
    return {
      relationships,
      total,
      page,
      totalPages,
      limit,
    };
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
