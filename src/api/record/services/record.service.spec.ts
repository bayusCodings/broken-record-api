import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Track } from '../schemas/track.schema';
import { Record } from '../schemas/record.schema';
import { RecordService } from './record.service';
import { RecordCache } from '../cache/record.cache';
import { RecordRepository } from '../repositories/record.repository';
import { MusicBrainzService } from '../integrations/musicbrainz.service';
import { asApiResponse, asPaginatedResponse } from '../../../core/response.dto';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

describe('RecordService', () => {
  let recordService: RecordService;
  let recordCache: RecordCache;
  let recordRepository: RecordRepository;
  let musicBrainzService: MusicBrainzService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        {
          provide: RecordCache,
          useValue: {
            clearRecords: jest.fn(),
            getRecords: jest.fn(),
            setRecords: jest.fn(),
            getTracklist: jest.fn(),
            setTracklist: jest.fn(),
          },
        },
        {
          provide: RecordRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            findRecords: jest.fn(),
          },
        },
        {
          provide: MusicBrainzService,
          useValue: {
            fetchTrackList: jest.fn(),
          },
        },
      ],
    }).compile();

    recordService = module.get<RecordService>(RecordService);
    recordCache = module.get<RecordCache>(RecordCache);
    recordRepository = module.get<RecordRepository>(RecordRepository);
    musicBrainzService = module.get<MusicBrainzService>(MusicBrainzService);
  });

  it('should be defined', () => {
    expect(recordService).toBeDefined();
    expect(recordCache).toBeDefined();
    expect(recordRepository).toBeDefined();
    expect(musicBrainzService).toBeDefined();
  });

  describe('createRecord', () => {
    const recordData: CreateRecordRequestDTO = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    it('should create a record only if MBID is not provided', async () => {
      const recordId = 'recordId123';
      const createdRecord = { ...recordData, _id: recordId } as Record;

      jest.spyOn(recordService, 'handleTracklistUpdate').mockResolvedValue([]);
      jest.spyOn(recordRepository, 'create').mockResolvedValue(createdRecord);
      const result = await recordService.createRecord(recordData);

      expect(recordRepository.create).toHaveBeenCalledWith(recordData);
      expect(recordService.handleTracklistUpdate).not.toHaveBeenCalled();
      expect(recordCache.clearRecords).toHaveBeenCalled();
      expect(result).toEqual(asApiResponse(createdRecord));
    });

    it('should create a record and update tracklist if MBID is provided', async () => {
      const mbid = 'mbid-12345';
      const recordDataMBID = { ...recordData, mbid };
      const recordId = 'recordId123';
      const createdRecord = { ...recordDataMBID, _id: recordId } as Record;

      jest.spyOn(recordService, 'handleTracklistUpdate').mockResolvedValue([]);
      jest.spyOn(recordRepository, 'create').mockResolvedValue(createdRecord);

      const result = await recordService.createRecord(recordDataMBID);

      expect(recordRepository.create).toHaveBeenCalledWith(recordData);
      expect(recordService.handleTracklistUpdate).toHaveBeenCalledWith(
        recordId,
        mbid,
      );
      expect(recordCache.clearRecords).toHaveBeenCalled();
      expect(result).toEqual(asApiResponse(createdRecord));
    });

    it('should throw ConflictException if record already exists (duplicate key error)', async () => {
      const duplicateKeyError = new MongoServerError({
        message: 'E11000 duplicate key error',
        code: 11000,
        keyValue: {
          artist: 'The Beatles',
          album: 'Abbey Road',
          format: RecordFormat.VINYL,
        },
      });

      jest
        .spyOn(recordRepository, 'create')
        .mockRejectedValue(duplicateKeyError);

      await expect(recordService.createRecord(recordData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const unexpectedError = new Error('Database connection lost');

      jest.spyOn(recordRepository, 'create').mockRejectedValue(unexpectedError);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(recordService.createRecord(recordData)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('updateRecord', () => {
    const recordData: Partial<Record> = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    it('should update record only if MBID is not provided', async () => {
      const recordId = 'recordId123';

      const updates: UpdateRecordRequestDTO = { album: 'Updated Title' };
      const existingRecord = { ...recordData, _id: recordId } as Record;
      const updatedRecord = { ...existingRecord, ...updates } as Record;

      jest
        .spyOn(recordService, 'handleTracklistUpdate')
        .mockResolvedValue(undefined);
      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(existingRecord);
      jest.spyOn(recordRepository, 'update').mockResolvedValue(updatedRecord);

      const result = await recordService.updateRecord(recordId, updates);

      expect(recordRepository.findById).toHaveBeenCalledWith(recordId);
      expect(recordService.handleTracklistUpdate).not.toHaveBeenCalled();
      expect(recordRepository.update).toHaveBeenCalledWith(recordId, updates);
      expect(recordCache.clearRecords).toHaveBeenCalled();
      expect(result).toEqual(asApiResponse(updatedRecord));
    });

    it('should update record and tracklist if MBID is provided', async () => {
      const recordId = 'recordId123';
      const mbid = 'mbid-12345';
      const updates = { album: 'Updated Title' };
      const updateRecordDTO = { mbid, album: 'Updated Title' };

      const existingRecord = { ...recordData, _id: recordId } as Record;
      const updatedRecord = { ...existingRecord, ...updates } as Record;
      const newTracklist = [
        {
          title: 'Track 1',
          length: 180000,
          position: 1,
          firstReleaseDate: '2009-01-01',
        },
      ] as Track[];

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(existingRecord);
      jest.spyOn(recordRepository, 'update').mockResolvedValue(updatedRecord);
      jest
        .spyOn(recordService, 'handleTracklistUpdate')
        .mockResolvedValue(newTracklist);

      const result = await recordService.updateRecord(
        recordId,
        updateRecordDTO,
      );

      expect(recordRepository.findById).toHaveBeenCalledWith(recordId);
      expect(recordService.handleTracklistUpdate).toHaveBeenCalledWith(
        recordId,
        mbid,
      );
      expect(recordRepository.update).toHaveBeenCalledWith(recordId, updates);
      expect(recordCache.clearRecords).toHaveBeenCalled();

      expect(result.data.tracklist).toEqual(newTracklist);
      expect(result).toEqual(
        asApiResponse({ ...updatedRecord, tracklist: newTracklist }),
      );
    });

    it('should throw NotFoundException if record is not found', async () => {
      const recordId = 'recordId123';
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(null);

      await expect(
        recordService.updateRecord(recordId, { album: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating causes a duplicate key error', async () => {
      const recordId = 'recordId123';
      const updates: UpdateRecordRequestDTO = { album: 'Updated Title' };
      const existingRecord = { ...recordData, _id: recordId } as Record;
      const duplicateKeyError = new MongoServerError({
        message: 'E11000 duplicate key error',
        code: 11000,
        keyValue: {
          artist: 'The Beatles',
          album: 'Abbey Road',
          format: RecordFormat.VINYL,
        },
      });

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(existingRecord);
      jest
        .spyOn(recordRepository, 'update')
        .mockRejectedValue(duplicateKeyError);

      await expect(
        recordService.updateRecord(recordId, updates),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const recordId = 'recordId123';
      const updates: UpdateRecordRequestDTO = { album: 'Updated Title' };
      const existingRecord = { ...recordData, _id: recordId } as Record;
      const unexpectedError = new Error('Database connection lost');

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(existingRecord);
      jest.spyOn(recordRepository, 'update').mockRejectedValue(unexpectedError);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(
        recordService.updateRecord(recordId, updates),
      ).rejects.toThrow(InternalServerErrorException);

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('findRecords', () => {
    it('should return cached records if available', async () => {
      const page = 1,
        size = 10;
      const query: FindRecordQueryDTO = { page, size, album: 'Test' };
      const cachedResponse = {
        data: [],
        pagination: new PaginationDTO(page, size, 50),
      };

      jest.spyOn(recordCache, 'getRecords').mockResolvedValue(cachedResponse);

      const result = await recordService.findRecords(query);
      expect(result).toEqual(cachedResponse);
      expect(recordCache.getRecords).toHaveBeenCalledWith(query);
      expect(recordRepository.findRecords).not.toHaveBeenCalled();
    });

    it('should fetch from DB if cached records are unavailable', async () => {
      const page = 1,
        size = 10;
      const query: FindRecordQueryDTO = { page, size, album: 'Test' };
      const dbResponse = { data: [], total: 50 };
      const response = asPaginatedResponse(
        dbResponse.data,
        new PaginationDTO(page, size, dbResponse.total),
      );

      jest.spyOn(recordCache, 'getRecords').mockResolvedValue(null);
      jest.spyOn(recordRepository, 'findRecords').mockResolvedValue(dbResponse);

      const result = await recordService.findRecords(query);
      expect(result).toEqual(response);
      expect(recordCache.getRecords).toHaveBeenCalledWith(query);
      expect(recordRepository.findRecords).toHaveBeenCalledWith(query);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const page = 1,
        size = 10;
      const query: FindRecordQueryDTO = { page, size, album: 'Test' };
      const unexpectedError = new Error('Database connection lost');

      jest.spyOn(recordCache, 'getRecords').mockResolvedValue(null);
      jest
        .spyOn(recordRepository, 'findRecords')
        .mockRejectedValue(unexpectedError);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await expect(recordService.findRecords(query)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('handleTracklistUpdate', () => {
    const recordId = 'recordId123';
    const mbid = 'mbid-12345';
    const mockTracklist = [
      {
        title: 'Track 1',
        length: 180000,
        position: 1,
        firstReleaseDate: '2009-01-01',
      },
    ] as Track[];

    it('should fetch tracklist from cache and update the record', async () => {
      jest.spyOn(recordCache, 'getTracklist').mockResolvedValue(mockTracklist);

      await recordService.handleTracklistUpdate(recordId, mbid);

      expect(recordCache.getTracklist).toHaveBeenCalledWith(mbid);
      expect(musicBrainzService.fetchTrackList).not.toHaveBeenCalled();
      expect(recordRepository.update).toHaveBeenCalledWith(recordId, {
        mbid,
        tracklist: mockTracklist,
      });
    });

    it('should fetch tracklist from MusicBrainz and update cache if not in cache', async () => {
      jest.spyOn(recordCache, 'getTracklist').mockResolvedValue(null);
      jest
        .spyOn(musicBrainzService, 'fetchTrackList')
        .mockResolvedValue(mockTracklist);

      await recordService.handleTracklistUpdate(recordId, mbid);

      expect(recordCache.getTracklist).toHaveBeenCalledWith(mbid);
      expect(musicBrainzService.fetchTrackList).toHaveBeenCalledWith(mbid);
      expect(recordCache.setTracklist).toHaveBeenCalledWith(
        mbid,
        mockTracklist,
      );
      expect(recordRepository.update).toHaveBeenCalledWith(recordId, {
        mbid,
        tracklist: mockTracklist,
      });
    });

    it('should not update the cache and return empty array if mbid is not found on MusicBrainz', async () => {
      jest.spyOn(recordCache, 'getTracklist').mockResolvedValue(null);
      jest.spyOn(musicBrainzService, 'fetchTrackList').mockResolvedValue([]);

      await recordService.handleTracklistUpdate(recordId, mbid);

      expect(recordCache.getTracklist).toHaveBeenCalledWith(mbid);
      expect(musicBrainzService.fetchTrackList).toHaveBeenCalledWith(mbid);
      expect(recordCache.setTracklist).not.toHaveBeenCalled();
      expect(recordRepository.update).not.toHaveBeenCalled();
    });

    it('should log appropriately if an error is encountered', async () => {
      jest.spyOn(recordCache, 'getTracklist').mockResolvedValue(null);
      jest
        .spyOn(musicBrainzService, 'fetchTrackList')
        .mockResolvedValue(mockTracklist);
      jest
        .spyOn(recordRepository, 'update')
        .mockRejectedValue(new Error('Encountered error'));
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      await recordService.handleTracklistUpdate(recordId, mbid);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
