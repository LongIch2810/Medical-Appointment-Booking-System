import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import Channel from 'src/entities/channel.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ChannelsService } from 'src/modules/channels/channels.service';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { BodyFilterChannelsDto } from 'src/modules/channels/dto/request/bodyFilterChannels.dto';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    andHaving: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getRawAndEntities: jest
      .fn()
      .mockResolvedValue({ entities: [], raw: [] }),
    ...overrides,
  };
}

describe('ChannelsService', () => {
  let service: ChannelsService;
  let channelRepo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let usersService: { isUserExists: jest.Mock };
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    channelRepo = {
      createQueryBuilder: jest.fn(() => makeQb()),
      findOne: jest.fn(),
    };
    usersService = { isUserExists: jest.fn().mockResolvedValue(true) };
    manager = {
      create: jest.fn((_entity: any, data: any) => data ?? {}),
      save: jest.fn((_entity: any, data: any) => Promise.resolve(data)),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((cb: any) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: getRepositoryToken(Channel), useValue: channelRepo },
        { provide: UsersService, useValue: usersService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  describe('createChannel', () => {
    it('throws BadRequestException when fewer than 2 unique members are given', async () => {
      await expect(service.createChannel([1, 1], 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the requester is not one of the members', async () => {
      await expect(service.createChannel([1, 2], 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when a member id does not correspond to an existing user', async () => {
      usersService.isUserExists.mockImplementation((id: number) =>
        Promise.resolve(id !== 2),
      );

      await expect(service.createChannel([1, 2], 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('returns the existing channel without saving a new one when the exact member set already has a channel', async () => {
      const existingChannelQb = makeQb({
        getOne: jest.fn().mockResolvedValue({ id: 5 }),
      });
      const findByIdQb = makeQb({
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [{ id: 5, participants: [] }],
          raw: [{ channel_id: 5 }],
        }),
      });
      channelRepo.createQueryBuilder
        .mockReturnValueOnce(existingChannelQb)
        .mockReturnValueOnce(findByIdQb);

      const result = await service.createChannel([1, 2], 1);

      expect(result).toMatchObject({ id: 5 });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('creates a channel with the given members when none exists yet', async () => {
      const existingChannelQb = makeQb({
        getOne: jest.fn().mockResolvedValue(null),
      });
      channelRepo.createQueryBuilder.mockReturnValueOnce(existingChannelQb);
      manager.save
        .mockResolvedValueOnce({ id: 10 }) // saved Channel
        .mockResolvedValueOnce([{}, {}]); // saved ChannelMembers
      manager.findOne.mockResolvedValue({ id: 10, participants: [] });

      const result = await service.createChannel([1, 2, 2], 1);

      expect(manager.save).toHaveBeenCalledWith(
        Channel,
        expect.anything(),
      );
      expect(manager.findOne).toHaveBeenCalledWith(
        Channel,
        expect.objectContaining({ where: { id: 10 } }),
      );
      expect(result).toMatchObject({ id: 10 });
    });

    it('maps a unique-constraint race during creation to a ConflictException', async () => {
      const raceError = new QueryFailedError('INSERT INTO channels...', undefined, {
        code: '23505',
      } as any);
      dataSource.transaction.mockRejectedValue(raceError);

      await expect(service.createChannel([1, 2], 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unexpected errors from the transaction', async () => {
      const unexpected = new Error('boom');
      dataSource.transaction.mockRejectedValue(unexpected);

      await expect(service.createChannel([1, 2], 1)).rejects.toThrow('boom');
    });
  });

  describe('findChannelsByUserId', () => {
    const baseFilters: BodyFilterChannelsDto = {
      page: 1,
      limit: 10,
      arrange: 'desc',
    } as BodyFilterChannelsDto;

    it('throws BadRequestException when the user does not exist', async () => {
      usersService.isUserExists.mockResolvedValue(false);

      await expect(
        service.findChannelsByUserId(1, baseFilters),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('clamps page/limit to a minimum of 1 and returns an enriched paginated result', async () => {
      const listQb = makeQb({
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [
            { id: 1, participants: [] },
            { id: 2, participants: [] },
          ],
          raw: [
            {
              channel_id: 1,
              last_message_content: 'iv:enc',
              last_message_created_at: new Date('2026-01-01'),
              last_message_sender_id: '5',
              unread_count: '2',
            },
            { channel_id: 2 },
          ],
        }),
      });
      const totalQb = makeQb({ getCount: jest.fn().mockResolvedValue(5) });
      channelRepo.createQueryBuilder
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(totalQb);

      const result = await service.findChannelsByUserId(9, {
        page: 0,
        limit: 0,
        arrange: 'asc',
      } as BodyFilterChannelsDto);

      expect(result).toBeInstanceOf(PaginationResultDto);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.channels).toHaveLength(2);
      expect(listQb.orderBy).toHaveBeenCalledWith(
        'last_message_created_at',
        'ASC',
        'NULLS LAST',
      );
      expect(listQb.skip).toHaveBeenCalledWith(0);
      expect(listQb.take).toHaveBeenCalledWith(1);
    });

    it('applies a username/fullname search filter to both the list and total-count queries', async () => {
      const listQb = makeQb();
      const totalQb = makeQb();
      channelRepo.createQueryBuilder
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(totalQb);

      await service.findChannelsByUserId(9, {
        ...baseFilters,
        search: 'John',
      } as BodyFilterChannelsDto);

      expect(listQb.andWhere).toHaveBeenCalled();
      expect(listQb.setParameter).toHaveBeenCalledWith('search', '%John%');
      expect(totalQb.andWhere).toHaveBeenCalled();
      expect(totalQb.setParameter).toHaveBeenCalledWith('search', '%John%');
    });
  });

  describe('getChannel', () => {
    it('delegates to findByChannelId and maps the result', async () => {
      jest.spyOn(service, 'findByChannelId').mockResolvedValue({
        id: 3,
        participants: [],
      } as any);

      const result = await service.getChannel(3, 9);

      expect(service.findByChannelId).toHaveBeenCalledWith(3, 9);
      expect(result).toMatchObject({ id: 3 });
    });
  });

  describe('findByChannelId', () => {
    it('throws BadRequestException when the channel is not found', async () => {
      channelRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getRawAndEntities: jest
            .fn()
            .mockResolvedValue({ entities: [], raw: [] }),
        }),
      );

      await expect(service.findByChannelId(999)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('enriches the found channel with last-message and unread-count fields', async () => {
      channelRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getRawAndEntities: jest.fn().mockResolvedValue({
            entities: [{ id: 7, participants: [] }],
            raw: [
              {
                channel_id: 7,
                last_message_content: 'iv:enc',
                last_message_created_at: new Date('2026-02-02'),
                last_message_sender_id: '3',
                unread_count: '4',
              },
            ],
          }),
        }),
      );

      const result = await service.findByChannelId(7, 9);

      expect(result).toMatchObject({
        id: 7,
        last_message_sender_id: '3',
        unread_count: 4,
      });
    });
  });

  describe('isChannelExists', () => {
    it('returns true when a matching channel/member row is found', async () => {
      channelRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(service.isChannelExists(9, 1)).resolves.toBe(true);
    });

    it('returns false when no matching channel/member row is found', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.isChannelExists(9, 1)).resolves.toBe(false);
    });
  });
});
