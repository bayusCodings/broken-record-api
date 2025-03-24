import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordRepository } from './record.repository';
import { Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

const recordId = 'recordId123';
const mockRecord = {
  _id: recordId,
  artist: 'Test Artist',
  album: 'Test Album',
  format: RecordFormat.VINYL,
  category: RecordCategory.ROCK,
} as Record;

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockRecordModel = {
  create: jest.fn().mockImplementation((records) => Promise.resolve(records)),
  findById: jest.fn().mockImplementation(() => ({
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockRecord),
  })),
  findByIdAndUpdate: jest.fn().mockImplementation((_id, updateData) => ({
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue({ ...mockRecord, ...updateData.$set }),
  })),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockRecord),
  }),
  find: jest.fn().mockImplementation(() => ({
    sort: jest.fn().mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue([mockRecord]),
        })),
      })),
    })),
  })),
  countDocuments: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(1),
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  db: {
    startSession: jest.fn().mockResolvedValue(mockSession),
  },
  prototype: {
    save: jest.fn().mockResolvedValue(mockRecord),
  },
};

describe('RecordRepository', () => {
  let recordRepository: RecordRepository;
  let recordModel: Model<Record>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordRepository,
        {
          provide: getModelToken(Record.name),
          useValue: mockRecordModel,
        },
      ],
    }).compile();

    recordRepository = module.get<RecordRepository>(RecordRepository);
    recordModel = module.get<Model<Record>>(getModelToken(Record.name));
  });

  it('should be defined', () => {
    expect(recordRepository).toBeDefined();
  });

  describe('create', () => {
    it('should create a record', async () => {
      const result = await recordRepository.create(mockRecord);

      expect(result).toEqual(mockRecord);
      expect(recordModel.create).toHaveBeenCalledWith([mockRecord], {
        session: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should find a record by ID', async () => {
      const result = await recordRepository.findById(recordId);

      expect(result).toEqual(mockRecord);
      expect(recordModel.findById).toHaveBeenCalledWith(recordId);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const updateData = { artist: 'Updated Artist' };
      const expectedRecord = { ...mockRecord, ...updateData };
      const result = await recordRepository.update(recordId, updateData);

      expect(result).toEqual(expectedRecord);
      expect(recordModel.findByIdAndUpdate).toHaveBeenCalledWith(
        recordId,
        { $set: updateData },
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const result = await recordRepository.delete(recordId);

      expect(result).toBe(true);
      expect(recordModel.findByIdAndDelete).toHaveBeenCalledWith(recordId);
    });
  });

  describe('findRecords', () => {
    it('should find records with pagination and filters', async () => {
      const query = { page: 1, size: 10, artist: 'Test Artist' };

      const result = await recordRepository.findRecords(query);

      expect(result).toEqual({ data: [mockRecord], total: 1 });
      expect(recordModel.find).toHaveBeenCalled();
      expect(recordModel.countDocuments).toHaveBeenCalled();
    });

    it('should apply text search filter', async () => {
      const query = { page: 1, size: 10, q: 'rock' };
      const expectedFilter = { $text: { $search: 'rock' } };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });

    it('should filter by artist name (case insensitive)', async () => {
      const query = { page: 1, size: 10, artist: 'Beatles' };
      const expectedFilter = { artist: { $regex: 'Beatles', $options: 'i' } };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });

    it('should filter by album name (case insensitive)', async () => {
      const query = { page: 1, size: 10, album: 'Abbey Road' };
      const expectedFilter = { album: { $regex: 'Abbey Road', $options: 'i' } };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });

    it('should filter by format', async () => {
      const query = { page: 1, size: 10, format: RecordFormat.VINYL };
      const expectedFilter = { format: RecordFormat.VINYL };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });

    it('should filter by category', async () => {
      const query = { page: 1, size: 10, category: RecordCategory.ROCK };
      const expectedFilter = { category: RecordCategory.ROCK };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });

    it('should apply multiple filters together', async () => {
      const query = {
        page: 1,
        size: 10,
        q: 'classic',
        artist: 'Queen',
        album: 'Greatest Hits',
        format: RecordFormat.CD,
        category: RecordCategory.ROCK,
      };
      const expectedFilter = {
        $text: { $search: 'classic' },
        artist: { $regex: 'Queen', $options: 'i' },
        album: { $regex: 'Greatest Hits', $options: 'i' },
        format: RecordFormat.CD,
        category: RecordCategory.ROCK,
      };

      await recordRepository.findRecords(query);

      expect(recordModel.find).toHaveBeenCalledWith(expectedFilter);
    });
  });

  describe('deleteMany', () => {
    it('should delete all records', async () => {
      await recordRepository.deleteMany();
      expect(recordModel.deleteMany).toHaveBeenCalled();
    });
  });

  describe('startSession', () => {
    it('should start a session', async () => {
      const session = await recordRepository.startSession();

      expect(mockRecordModel.db.startSession).toHaveBeenCalledTimes(1);
      expect(session).toBe(mockSession);
    });
  });
});
