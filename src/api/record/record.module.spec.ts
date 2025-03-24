import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { RecordModule } from './record.module';
import { Record } from './schemas/record.schema';
import { RecordService } from './services/record.service';
import { RecordRepository } from './repositories/record.repository';
import { RecordController } from './controllers/record.controller';
import { RecordCache } from './cache/record.cache';
import { MusicBrainzService } from './integrations/musicbrainz.service';
import { RedisService } from '../../shared/redis/redis.service';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('RecordModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RecordModule],
    })
      .overrideProvider(getModelToken(Record.name))
      .useValue({
        create: jest.fn(),
        find: jest.fn(),
      })
      .overrideProvider(HttpService)
      .useValue({
        get: jest.fn(),
      })
      .overrideProvider(RedisService)
      .useValue({
        set: jest.fn(),
        get: jest.fn()
      })
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile the module', async () => {
    expect(module).toBeDefined();
  });

  it('should resolve RecordService', async () => {
    const service = module.get<RecordService>(RecordService);
    expect(service).toBeDefined();
  });

  it('should resolve RecordRepository', async () => {
    const repository = module.get<RecordRepository>(RecordRepository);
    expect(repository).toBeDefined();
  });

  it('should resolve RecordController', async () => {
    const controller = module.get<RecordController>(RecordController);
    expect(controller).toBeDefined();
  });

  it('should resolve RecordCache', async () => {
    const cache = module.get<RecordCache>(RecordCache);
    expect(cache).toBeDefined();
  });

  it('should resolve MusicBrainzService', async () => {
    const musicBrainzService = module.get<MusicBrainzService>(MusicBrainzService);
    expect(musicBrainzService).toBeDefined();
  });
});