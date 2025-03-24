import { Test, TestingModule } from '@nestjs/testing';
import { Record } from '../schemas/record.schema';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import {
  asApiResponse,
  asPaginatedResponse,
  PaginatedResponseDTO,
} from '../../../core/response.dto';
import { RecordController } from './record.controller';
import { RecordService } from '../services/record.service';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordService: RecordService;

  const mockRecordService = {
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    findRecords: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: mockRecordService,
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
  });

  it('should be defined', () => {
    expect(recordController).toBeDefined();
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const dto: CreateRecordRequestDTO = {
        artist: 'Test Artist',
        album: 'Test Album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      };
      const createdRecord = { _id: 'recordId123', ...dto } as Record;
      const mockResponse = asApiResponse(createdRecord);

      mockRecordService.createRecord.mockResolvedValue(mockResponse);

      const result = await recordController.create(dto);

      expect(result).toEqual(mockResponse);
      expect(recordService.createRecord).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update a record and return updated record', async () => {
      const updateRecordDto: UpdateRecordRequestDTO = {
        artist: 'Updated Artist',
      };

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

      const updatedRecord = asApiResponse({ ...record, ...updateRecordDto });
      mockRecordService.updateRecord.mockResolvedValue(updatedRecord);

      const result = await recordController.update(recordId, updateRecordDto);

      expect(result).toEqual(updatedRecord);
      expect(recordService.updateRecord).toHaveBeenCalledWith(
        recordId,
        updateRecordDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated records', async () => {
      const page = 1,
        size = 10,
        total = 50;
      const query: FindRecordQueryDTO = { page, size, artist: 'Test Artist' };
      const record = {
        _id: 'recordId123',
        artist: 'Test Artist',
        album: 'Test Album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      } as Record;
      const mockPaginatedResponse: PaginatedResponseDTO<Record> =
        asPaginatedResponse([record], new PaginationDTO(page, size, total));

      mockRecordService.findRecords.mockResolvedValue(mockPaginatedResponse);

      const result = await recordController.findAll(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(recordService.findRecords).toHaveBeenCalledWith(query);
    });
  });
});
