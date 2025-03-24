import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

jest.mock('ioredis');

describe('RedisService', () => {
  let redisService: RedisService;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    redisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: redisClient,
        },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  describe('set', () => {
    it('should store a value in Redis with a TTL', async () => {
      await redisService.set('testKey', 'testValue', 600);
      expect(redisClient.set).toHaveBeenCalledWith(
        'hostelworld_testKey',
        'testValue',
        'EX',
        600,
      );
    });
  });

  describe('get', () => {
    it('should retrieve a value from Redis', async () => {
      redisClient.get.mockResolvedValue('testValue');
      const result = await redisService.get('testKey');

      expect(redisClient.get).toHaveBeenCalledWith('hostelworld_testKey');
      expect(result).toBe('testValue');
    });

    it('should return null if key is not found', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await redisService.get('testKey');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a specific key from Redis', async () => {
      await redisService.delete('testKey');
      expect(redisClient.del).toHaveBeenCalledWith('hostelworld_testKey');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple keys matching a pattern', async () => {
      redisClient.keys.mockResolvedValue([
        'hostelworld_testKey1',
        'hostelworld_testKey2',
      ]);
      await redisService.deleteMany('testKey*');

      expect(redisClient.keys).toHaveBeenCalledWith('hostelworld_testKey*');
      expect(redisClient.del).toHaveBeenCalledWith(
        'hostelworld_testKey1',
        'hostelworld_testKey2',
      );
    });

    it('should not call del if no keys match', async () => {
      redisClient.keys.mockResolvedValue([]);
      await redisService.deleteMany('testKey*');

      expect(redisClient.keys).toHaveBeenCalledWith('hostelworld_testKey*');
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
