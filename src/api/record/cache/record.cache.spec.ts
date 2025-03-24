import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RecordCache } from './record.cache';
import { Record } from '../schemas/record.schema';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Track } from '../schemas/track.schema';
import {
  asPaginatedResponse,
  PaginatedResponseDTO,
} from '../../../core/response.dto';
import { RedisService } from '../../../shared/redis/redis.service';
import { PaginationDTO } from '../../../core/pagination.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';

jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-hash'),
  }),
}));

describe('RecordCache', () => {
  let recordCache: RecordCache;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordCache,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            deleteMany: jest.fn(),
          },
        },
      ],
    }).compile();

    recordCache = module.get<RecordCache>(RecordCache);
    redisService = module.get<RedisService>(RedisService);
  });

  const page = 1,
    size = 10,
    total = 50;
  const recordId = 'recordId123';
  const record = {
    _id: recordId,
    artist: 'Test Artist',
    album: 'Test Album',
    price: 100,
    qty: 10,
    format: RecordFormat.VINYL,
    category: RecordCategory.ALTERNATIVE,
  } as Record;

  const mockPaginatedResponse: PaginatedResponseDTO<Record> =
    asPaginatedResponse([record], new PaginationDTO(page, size, total));

  const tracklist = [
    {
      position: 1,
      title: 'Track 1',
      length: 180000,
      firstReleaseDate: '2023-01-01',
    },
    {
      position: 2,
      title: 'Track 2',
      length: 200000,
      firstReleaseDate: '2023-02-01',
    },
  ] as Track[];

  describe('getTracklist', () => {
    it('should return tracklist from cache', async () => {
      const mbid = 'mbid-12345';
      redisService.get = jest.fn().mockResolvedValue(JSON.stringify(tracklist));

      const result = await recordCache.getTracklist(mbid);

      expect(result).toEqual(tracklist);
      expect(redisService.get).toHaveBeenCalledWith(`tracklist:${mbid}`);
    });

    it('should return null if cache is empty', async () => {
      const mbid = 'mbid-12345';
      redisService.get = jest.fn().mockResolvedValue(null);

      const result = await recordCache.getTracklist(mbid);

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith(`tracklist:${mbid}`);
    });

    it('should return null and log error when an error occurs', async () => {
      const mbid = 'mbid-12345';
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisService.get = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await recordCache.getTracklist(mbid);

      expect(result).toBeNull();
      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(redisService.get).toHaveBeenCalledWith(`tracklist:${mbid}`);
    });
  });

  describe('setTracklist', () => {
    it('should store tracklist in cache', async () => {
      const mbid = 'mbid-12345';
      await recordCache.setTracklist(mbid, tracklist);

      expect(redisService.set).toHaveBeenCalledWith(
        `tracklist:${mbid}`,
        JSON.stringify(tracklist),
        86400,
      );
    });

    it('should log error if an error occurs', async () => {
      const mbid = 'mbid-12345';
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisService.set = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      await recordCache.setTracklist(mbid, tracklist);

      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        `tracklist:${mbid}`,
        JSON.stringify(tracklist),
        86400,
      );
    });
  });

  describe('setRecords', () => {
    it('should store records in cache', async () => {
      const query: FindRecordQueryDTO = { page, size, artist: 'Bon Jovi' };
      await recordCache.setRecords(query, mockPaginatedResponse);

      expect(redisService.set).toHaveBeenCalledWith(
        `records:page=1:size=10:filters=mocked-hash`,
        JSON.stringify(mockPaginatedResponse),
        300,
      );
    });

    it('should log error if an error occurs', async () => {
      const query: FindRecordQueryDTO = { page, size, artist: 'Bon Jovi' };

      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisService.set = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      await recordCache.setRecords(query, mockPaginatedResponse);

      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        `records:page=1:size=10:filters=mocked-hash`,
        JSON.stringify(mockPaginatedResponse),
        300,
      );
    });
  });

  describe('getRecords', () => {
    it('should return records from cache', async () => {
      const query: FindRecordQueryDTO = { page, size, artist: 'Bon Jovi' };
      const cachedData = mockPaginatedResponse;

      redisService.get = jest
        .fn()
        .mockResolvedValue(JSON.stringify(cachedData));

      const result = await recordCache.getRecords(query);

      expect(result).toEqual(cachedData);
      expect(redisService.get).toHaveBeenCalledWith(
        `records:page=1:size=10:filters=mocked-hash`,
      );
    });

    it('should return null and log error when an error occurs', async () => {
      const query: FindRecordQueryDTO = { page, size, artist: 'Bon Jovi' };

      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisService.get = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await recordCache.getRecords(query);

      expect(result).toBeNull();
      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(redisService.get).toHaveBeenCalledWith(
        `records:page=1:size=10:filters=mocked-hash`,
      );
    });
  });

  describe('clearRecords', () => {
    it('should delete all cached records', async () => {
      await recordCache.clearRecords();

      expect(redisService.deleteMany).toHaveBeenCalledWith('records:*');
    });

    it('should log error when an error occurs', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      redisService.deleteMany = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      await recordCache.clearRecords();

      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(redisService.deleteMany).toHaveBeenCalledWith('records:*');
    });
  });
});
