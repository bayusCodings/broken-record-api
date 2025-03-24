import Redis from 'ioredis';
import { Test } from '@nestjs/testing';
import { REDIS_CLIENT, RedisProvider } from './redis.provider';
import { AppConfig } from '../../app.config';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('RedisProvider', () => {
  let redisClient: Redis;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [RedisProvider],
    }).compile();

    redisClient = moduleRef.get<Redis>(REDIS_CLIENT);
  });

  it('should provide a Redis client instance', () => {
    expect(redisClient).toBeDefined();
    expect(Redis).toHaveBeenCalledWith(AppConfig.redisUri);
  });
});
