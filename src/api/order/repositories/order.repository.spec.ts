import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrderRepository } from './order.repository';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';

const orderId = 'orderId123';
const recordId = 'recordId123';
const mockOrder = {
  _id: orderId,
  recordId,
  quantity: 10,
} as Order;

const mockOrderModel = {
  create: jest.fn().mockImplementation((orders) => Promise.resolve(orders)),
  findById: jest.fn().mockImplementation(() => ({
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockOrder),
  })),
  findByIdAndUpdate: jest.fn().mockImplementation((_id, updateData) => ({
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue({ ...mockOrder, ...updateData.$set }),
  })),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockOrder),
  }),
  find: jest.fn().mockImplementation(() => ({
    populate: jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockImplementation(() => ({
        skip: jest.fn().mockImplementation(() => ({
          limit: jest.fn().mockImplementation(() => ({
            exec: jest.fn().mockResolvedValue([mockOrder]),
          })),
        })),
      })),
    })),
  })),
  countDocuments: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(1),
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  prototype: {
    save: jest.fn().mockResolvedValue(mockOrder),
  },
};

describe('OrderRepository', () => {
  let orderRepository: OrderRepository;
  let orderModel: Model<Order>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    orderRepository = module.get<OrderRepository>(OrderRepository);
    orderModel = module.get<Model<Order>>(getModelToken(Order.name));
  });

  it('should be defined', () => {
    expect(orderRepository).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const result = await orderRepository.create(mockOrder);

      expect(result).toEqual(mockOrder);
      expect(orderModel.create).toHaveBeenCalledWith([mockOrder], {
        session: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should find a record by ID', async () => {
      const result = await orderRepository.findById(recordId);

      expect(result).toEqual(mockOrder);
      expect(orderModel.findById).toHaveBeenCalledWith(recordId);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      const updateData = { quantity: 5 };
      const expectedOrder = { ...mockOrder, ...updateData };
      const result = await orderRepository.update(orderId, updateData);

      expect(result).toEqual(expectedOrder);
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        orderId,
        { $set: updateData },
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const result = await orderRepository.delete(recordId);

      expect(result).toBe(true);
      expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith(recordId);
    });
  });

  describe('findOrders', () => {
    it('should find orders with pagination and filters', async () => {
      const query = { page: 1, size: 10 };

      const result = await orderRepository.findOrders(query);

      expect(result).toEqual({ data: [mockOrder], total: 1 });
      expect(orderModel.find).toHaveBeenCalled();
      expect(orderModel.countDocuments).toHaveBeenCalled();
    });

    it('should filter by recordId', async () => {
      const query = { page: 1, size: 10, recordId };
      const expectedFilter = { recordId };

      await orderRepository.findOrders(query);

      expect(orderModel.find).toHaveBeenCalledWith(expectedFilter);
    });
  });

  describe('deleteMany', () => {
    it('should delete all orders', async () => {
      await orderRepository.deleteMany();
      expect(orderModel.deleteMany).toHaveBeenCalled();
    });
  });
});
