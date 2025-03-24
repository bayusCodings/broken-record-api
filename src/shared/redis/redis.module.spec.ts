import { Test } from '@nestjs/testing';
import { RedisModule } from './redis.module';
import { REDIS_CLIENT } from './redis.provider';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('RedisModule', () => {
  let redisClient: Redis;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    redisClient = moduleRef.get<Redis>(REDIS_CLIENT);
  });

  it('should provide a Redis client instance', () => {
    expect(redisClient).toBeDefined();
  });
});
