import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/redis/redis.service';
import { BaseService } from '../../../core/base/base.service';
import { Record } from '../schemas/record.schema';
import { Track } from '../schemas/track.schema';
import { PaginatedResponseDTO } from '../../../core/response.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';
import * as crypto from 'crypto';

@Injectable()
export class RecordCache extends BaseService {
  constructor(private readonly redisService: RedisService) {
    super(RecordCache.name);
  }

  async setTracklist(mbid: string, tracklist: Track[]): Promise<void> {
    try {
      await this.redisService.set(
        `tracklist:${mbid}`,
        JSON.stringify(tracklist),
        86400,
      );
    } catch (error) {
      this.logger.error(
        `[Redis error: failed to cache tracklist for ${mbid}] ${error.message}`,
        error.stack,
      );
    }
  }

  async getTracklist(mbid: string): Promise<Track[] | null> {
    try {
      const cachedData = await this.redisService.get(`tracklist:${mbid}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      this.logger.error(
        `[Redis error: failed to retrieve tracklist for ${mbid}] ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async setRecords(
    query: FindRecordQueryDTO,
    data: PaginatedResponseDTO<Record>,
  ): Promise<void> {
    try {
      const { page, size, ...filters } = query;
      const filterHash = this.hashFilters(filters);
      const key = `records:page=${page}:size=${size}:filters=${filterHash}`;

      await this.redisService.set(key, JSON.stringify(data), 300);
    } catch (error) {
      this.logger.error(
        `[Redis error: failed to cache records] ${error.message}`,
        error.stack,
      );
    }
  }

  async getRecords(
    query: FindRecordQueryDTO,
  ): Promise<PaginatedResponseDTO<Record>> {
    try {
      const { page, size, ...filters } = query;
      const filterHash = this.hashFilters(filters);
      const key = `records:page=${page}:size=${size}:filters=${filterHash}`;

      const cachedData = await this.redisService.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      this.logger.error(
        `[Redis error: failed to cache records] ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async clearRecords(): Promise<void> {
    try {
      // delete cached records matching this pattern
      await this.redisService.deleteMany('records:*');
    } catch (error) {
      this.logger.error(
        `[Redis error: failed to clear records cache] ${error.message}`,
        error.stack,
      );
    }
  }

  private hashFilters(filters: FindRecordQueryDTO): string {
    const queryString = JSON.stringify(filters);
    return crypto.createHash('md5').update(queryString).digest('hex');
  }
}
