import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordCache } from '../record/cache/record.cache';
import { OrderModule } from './order.module';
import { RecordModule } from '../record/record.module';
import { Order } from './schemas/order.schema';
import { Record } from '../record/schemas/record.schema';
import { OrderRepository } from './repositories/order.repository';
import { RecordRepository } from '../record/repositories/record.repository';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('OrderModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [OrderModule, RecordModule],
    })
      .overrideProvider(getModelToken(Order.name))
      .useValue({
        create: jest.fn(),
        find: jest.fn(),
      })
      .overrideProvider(getModelToken(Record.name))
      .useValue({
        create: jest.fn(),
        find: jest.fn(),
      })
      .overrideProvider(RecordCache)
      .useValue({
        getTracklist: jest.fn(),
        setTracklist: jest.fn(),
        setRecords: jest.fn(),
        getRecords: jest.fn(),
      })
      .overrideProvider(RecordRepository)
      .useValue({
        findById: jest.fn(),
        update: jest.fn(),
      })
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should provide an OrderService', () => {
    const service = module.get<OrderService>(OrderService);
    expect(service).toBeDefined();
  });

  it('should provide an OrderRepository', () => {
    const repository = module.get<OrderRepository>(OrderRepository);
    expect(repository).toBeDefined();
  });

  it('should provide an OrderController', () => {
    const controller = module.get<OrderController>(OrderController);
    expect(controller).toBeDefined();
  });
});
