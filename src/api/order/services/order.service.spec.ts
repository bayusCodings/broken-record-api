import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { asApiResponse, asPaginatedResponse } from '../../../core/response.dto';
import { Order } from '../schemas/order.schema';
import { Record } from '../../record/schemas/record.schema';
import { OrderService } from './order.service';
import { OrderRepository } from '../repositories/order.repository';
import { RecordRepository } from '../../record/repositories/record.repository';
import { RecordCache } from '../../record/cache/record.cache';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { RecordCategory, RecordFormat } from '../../record/schemas/record.enum';
import { FindOrderQueryDTO } from '../dtos/find-order.query.dto';

describe('OrderService', () => {
  let recordCache: RecordCache;
  let orderService: OrderService;
  let orderRepository: OrderRepository;
  let recordRepository: RecordRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: RecordCache,
          useValue: {
            clearRecords: jest.fn(),
          },
        },
        {
          provide: OrderRepository,
          useValue: {
            create: jest.fn(),
            findOrders: jest.fn(),
          },
        },
        {
          provide: RecordRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            startSession: jest.fn().mockResolvedValue({
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              abortTransaction: jest.fn(),
              endSession: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    recordCache = module.get<RecordCache>(RecordCache);
    orderService = module.get<OrderService>(OrderService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    recordRepository = module.get<RecordRepository>(RecordRepository);
  });

  it('should be defined', () => {
    expect(recordCache).toBeDefined();
    expect(orderService).toBeDefined();
    expect(orderRepository).toBeDefined();
    expect(recordRepository).toBeDefined();
  });

  const recordId = 'recordId123';
  const record = {
    _id: recordId,
    artist: 'The Beatles',
    album: 'Abbey Road',
    price: 25,
    qty: 10,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
  } as Record;

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderData: CreateOrderRequestDTO = { recordId, quantity: 2 };
      const order: Order = { id: 'orderId123', ...orderData } as Order;

      jest.spyOn(recordRepository, 'findById').mockResolvedValue(record);
      jest.spyOn(recordRepository, 'update').mockResolvedValue(null);
      jest.spyOn(orderRepository, 'create').mockResolvedValue(order);

      const result = await orderService.createOrder(orderData);
      expect(result).toEqual(asApiResponse(order));
      expect(recordCache.clearRecords).toHaveBeenCalled();
    });

    it('should throw NotFoundException if record does not exist', async () => {
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(null);
      const orderData: CreateOrderRequestDTO = { recordId, quantity: 2 };

      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if order quantity exceeds stock', async () => {
      const orderData: CreateOrderRequestDTO = { recordId, quantity: 100 };
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(record);

      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle internal server errors', async () => {
      const orderData: CreateOrderRequestDTO = { recordId, quantity: 2 };
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(record);
      jest
        .spyOn(recordRepository, 'update')
        .mockRejectedValue(new Error('Database error'));

      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOrders', () => {
    it('should return paginated orders', async () => {
      const page = 1,
        size = 10;
      const query: FindOrderQueryDTO = { page, size };
      const dbResponse = { data: [], total: 50 };
      const response = asPaginatedResponse(
        dbResponse.data,
        new PaginationDTO(page, size, dbResponse.total),
      );

      jest.spyOn(orderRepository, 'findOrders').mockResolvedValue(dbResponse);

      const result = await orderService.findOrders(query);
      expect(result).toEqual(response);
      expect(orderRepository.findOrders).toHaveBeenCalledWith(query);
    });

    it('should handle errors when finding orders', async () => {
      const query: FindOrderQueryDTO = { page: 1, size: 10 };

      jest
        .spyOn(orderRepository, 'findOrders')
        .mockRejectedValue(new Error('Database Error'));
      await expect(orderService.findOrders(query)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
