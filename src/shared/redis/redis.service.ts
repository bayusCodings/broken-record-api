import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService {
  private cachePrefix = 'hostelworld';
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  private getCacheKey(key: string): string {
    return `${this.cachePrefix}_${key}`;
  }

  /**
   * Set a cache entry in Redis with an optional expiration time
   * @param key Cache key
   * @param value Value to store (must be a string)
   * @param ttl Expiration time in seconds (default: 300s / 5 minutes)
   */
  async set(key: string, value: string, ttl = 300): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    await this.redisClient.set(cacheKey, value, 'EX', ttl);
  }

  /**
   * Get cached data from Redis
   * @param key Cache key
   * @returns Cached value or null
   */
  async get(key: string): Promise<string | null> {
    const cacheKey = this.getCacheKey(key);
    return this.redisClient.get(cacheKey);
  }

  /**
   * Delete a specific cache entry
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    await this.redisClient.del(cacheKey);
  }

  /**
   * Delete multiple cache entries
   * @param key key
   */
  async deleteMany(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const keys = await this.redisClient.keys(cacheKey);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}
