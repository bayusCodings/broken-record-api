import Redis from 'ioredis';
import { Test } from '@nestjs/testing';
import { SharedModule } from './shared.module';
import { RedisService } from './redis/redis.service';
import { REDIS_CLIENT } from './redis/redis.provider';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('SharedModule', () => {
  let redisClient: Redis;
  let redisService: RedisService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SharedModule],
    }).compile();

    redisClient = moduleRef.get<Redis>(REDIS_CLIENT);
    redisService = moduleRef.get<RedisService>(RedisService);
  });

  it('should provide a Redis client instance', () => {
    expect(redisClient).toBeDefined();
  });

  it('should provide a RedisService instance', () => {
    expect(redisService).toBeDefined();
  });
});
