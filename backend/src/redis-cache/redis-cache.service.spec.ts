import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { RedisCacheService } from './redis-cache.service';

const mockPipeline = { del: jest.fn(), exec: jest.fn().mockResolvedValue([]) };
const mockScanStream = new EventEmitter();
const mockRedisInstance = {
  scanStream: jest.fn(() => mockScanStream),
  pipeline: jest.fn(() => mockPipeline),
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockScanStream.removeAllListeners();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('delByPrefix', () => {
    it('scans with a wildcard match and deletes every key found', async () => {
      const promise = service.delByPrefix('articles:');
      mockScanStream.emit('data', ['articles:page=1', 'articles:page=2']);
      mockScanStream.emit('end');
      await promise;

      expect(mockRedisInstance.scanStream).toHaveBeenCalledWith({
        match: 'articles:*',
      });
      expect(mockPipeline.del).toHaveBeenCalledWith('articles:page=1');
      expect(mockPipeline.del).toHaveBeenCalledWith('articles:page=2');
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no keys match the prefix', async () => {
      const promise = service.delByPrefix('doctors:');
      mockScanStream.emit('end');
      await promise;

      expect(mockPipeline.del).not.toHaveBeenCalled();
      expect(mockPipeline.exec).not.toHaveBeenCalled();
    });
  });
});
