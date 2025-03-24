import Redis from 'ioredis';
import { Provider } from '@nestjs/common';
import { AppConfig } from '../../app.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (): Promise<Redis> => {
    return new Redis(AppConfig.redisUri);
  },
};
