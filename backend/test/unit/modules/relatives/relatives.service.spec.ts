import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource, QueryFailedError } from 'typeorm';
import Relative from 'src/entities/relative.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';
import { UsersService } from 'src/modules/users/users.service';
import { RelationshipsService } from 'src/modules/relationships/relationships.service';
import { RelativesService } from 'src/modules/relatives/relatives.service';
import { BodyCreateRelativeDto } from 'src/modules/relatives/dto/request/bodyCreateRelative.dto';

function makeMockManager(findOneResult: any = null) {
  return {
    findOne: jest.fn().mockResolvedValue(findOneResult),
    create: jest.fn((_entity: any, data: any) => data),
    save: jest.fn((_entity: any, data: any) =>
      Promise.resolve({ id: 77, ...data }),
    ),
  };
}

function makeRelativeLockQb(getOneResult: any = null) {
  return {
    setLock: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(getOneResult),
  };
}

function withRelativeLockRepo(manager: Record<string, any>, relativeQb: any) {
  manager.getRepository = jest.fn().mockReturnValue({
    createQueryBuilder: jest.fn().mockReturnValue(relativeQb),
  });
  return manager;
}

describe('RelativesService', () => {
  let service: RelativesService;
  let relativeRepo: { findOne: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    relativeRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelativesService,
        { provide: getRepositoryToken(Relative), useValue: relativeRepo },
        {
          provide: UsersService,
          useValue: { isUserExists: jest.fn().mockResolvedValue(true) },
        },
        { provide: RelationshipsService, useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<RelativesService>(RelativesService);
  });

  function makeQb() {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn(),
      select: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orWhere: jest.fn(),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    Object.values(qb).forEach((fn) => {
      if (fn !== qb.getManyAndCount) fn.mockReturnValue(qb);
    });
    return qb;
  }

  describe('findRelativesByUserId', () => {
    it('keeps the ownership filter as a single top-level where and puts search in an andWhere(Brackets)', async () => {
      const qb = makeQb();
      (relativeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findRelativesByUserId(9, {
        page: 1,
        limit: 10,
        arrange: 'desc',
        search: 'anything',
      } as any);

      expect(qb.where).toHaveBeenCalledTimes(1);
      expect(qb.where).toHaveBeenCalledWith('user.id = :userId', {
        userId: 9,
      });
      expect(qb.orWhere).not.toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    });
  });

  describe('findOwnedByUserId', () => {
    it('scopes the lookup to the requesting patient when no roles are given', async () => {
      relativeRepo.findOne.mockResolvedValue({ id: 1 });

      await service.findOwnedByUserId(9, 1);

      expect(relativeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 9 } },
        relations: ['relationship', 'health_profile', 'user'],
      });
    });

    // Regression test: admin/relatives (RELATIVE_MANAGE) lets an admin list
    // every patient's relative, but Sửa/Xóa/Xem on that same list called
    // update()/remove()/getRelativeDetail() -> findOwnedByUserId() scoped by
    // the ADMIN's own userId — confirmed live: admin (id 1) editing a
    // patient's relative (owned by a different userId) 404'd with "Người
    // thân không tồn tại hoặc không thuộc quyền quản lý của bạn." even
    // though the record exists. ADMIN must bypass the ownership filter.
    it('does not scope by owner when the actor is ADMIN', async () => {
      relativeRepo.findOne.mockResolvedValue({ id: 1 });

      await service.findOwnedByUserId(1, 38, ['ADMIN']);

      expect(relativeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 38 },
        relations: ['relationship', 'health_profile', 'user'],
      });
    });

    it('throws NotFoundException when the relative does not exist or is not owned by the requester', async () => {
      relativeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOwnedByUserId(9, 404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findOrCreateForBooking', () => {
    const dto: BodyCreateRelativeDto = {
      fullname: 'Nguyen Van A',
      relationship_code: 'con_gai',
      phone: '0912345678',
      dob: '2015-05-01',
      gender: false,
    };

    it('throws NotFoundException when relationship_code does not exist', async () => {
      const manager = makeMockManager(null);

      await expect(
        service.findOrCreateForBooking(manager as any, 9, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reuses an existing relative matching fullname + relationship_code + phone instead of creating a duplicate', async () => {
      const relationship = { relationship_code: 'con_gai' };
      const existingRelative = { id: 5, fullname: dto.fullname };
      const relativeQb = makeRelativeLockQb(existingRelative);
      const manager = withRelativeLockRepo(
        {
          findOne: jest.fn().mockResolvedValueOnce(relationship), // Relationship lookup
          create: jest.fn(),
          save: jest.fn(),
        },
        relativeQb,
      );

      const result = await service.findOrCreateForBooking(
        manager as any,
        9,
        dto,
      );

      expect(result).toBe(existingRelative);
      expect(relativeQb.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('creates a new Relative + HealthProfile when no existing match is found', async () => {
      const relationship = { relationship_code: 'con_gai' };
      const relativeQb = makeRelativeLockQb(null);
      const manager = withRelativeLockRepo(
        {
          findOne: jest.fn().mockResolvedValueOnce(relationship), // Relationship lookup
          create: jest.fn((_entity: any, data: any) => data),
          save: jest
            .fn()
            .mockResolvedValueOnce({ id: 77, ...dto })
            .mockResolvedValueOnce({ id: 1 }),
        },
        relativeQb,
      );

      const result = await service.findOrCreateForBooking(
        manager as any,
        9,
        dto,
      );

      expect(result).toEqual(expect.objectContaining({ id: 77 }));
      expect(manager.create).toHaveBeenCalledWith(
        Relative,
        expect.objectContaining({
          fullname: dto.fullname,
          phone: dto.phone,
          user: { id: 9 },
          relationship: { relationship_code: dto.relationship_code },
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        HealthProfile,
        expect.objectContaining({ patient: { id: 77 } }),
      );
    });

    it('creates a new relative without a duplicate check when phone is not provided', async () => {
      const relationship = { relationship_code: 'con_gai' };
      const dtoNoPhone = { ...dto, phone: undefined };
      const manager = {
        findOne: jest.fn().mockResolvedValueOnce(relationship),
        create: jest.fn((_entity: any, data: any) => data),
        save: jest
          .fn()
          .mockResolvedValueOnce({ id: 77, ...dtoNoPhone })
          .mockResolvedValueOnce({ id: 1 }),
      };

      await service.findOrCreateForBooking(manager as any, 9, dtoNoPhone);

      expect(manager.findOne).toHaveBeenCalledTimes(1);
      expect(manager.findOne).toHaveBeenCalledWith(
        Relationship,
        expect.anything(),
      );
    });

    it('maps a unique-phone race (23505) to a 409 Conflict', async () => {
      const relationship = { relationship_code: 'con_gai' };
      const pgError = Object.assign(
        new QueryFailedError('insert', [], new Error('duplicate key')),
        { driverError: { code: '23505' } },
      );
      const relativeQb = makeRelativeLockQb(null);
      const manager = withRelativeLockRepo(
        {
          findOne: jest.fn().mockResolvedValueOnce(relationship),
          create: jest.fn((_entity: any, data: any) => data),
          save: jest.fn().mockRejectedValue(pgError),
        },
        relativeQb,
      );

      await expect(
        service.findOrCreateForBooking(manager as any, 9, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
