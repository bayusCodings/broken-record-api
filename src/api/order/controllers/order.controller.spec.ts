import { Test, TestingModule } from '@nestjs/testing';
import { Order } from '../schemas/order.schema';
import { OrderService } from '../services/order.service';
import { OrderController } from './order.controller';
import {
  asApiResponse,
  asPaginatedResponse,
  PaginatedResponseDTO,
} from '../../../core/response.dto';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { FindOrderQueryDTO } from '../dtos/find-order.query.dto';

describe('OrderController', () => {
  let orderController: OrderController;
  let orderService: OrderService;

  const mockOrderService = {
    createOrder: jest.fn(),
    findOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    orderController = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(orderController).toBeDefined();
  });

  describe('create', () => {
    it('should create new order', async () => {
      const dto: CreateOrderRequestDTO = {
        recordId: 'recordId123',
        quantity: 10,
      };

      const createdOrder: Order = { _id: 'orderId123', ...dto } as Order;
      const mockResponse = asApiResponse(createdOrder);

      mockOrderService.createOrder.mockResolvedValue(mockResponse);

      const result = await orderController.create(dto);

      expect(result).toEqual(mockResponse);
      expect(orderService.createOrder).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const query: FindOrderQueryDTO = { page: 1, size: 10 };
      const page = 1,
        size = 10,
        total = 50;
      const order = {
        _id: 'orderId123',
        recordId: 'recordId123',
        quantity: 10,
      } as Order;

      const mockPaginatedResponse: PaginatedResponseDTO<Order> =
        asPaginatedResponse([order], new PaginationDTO(page, size, total));

      mockOrderService.findOrders.mockResolvedValue(mockPaginatedResponse);

      const result = await orderController.findAll(query);
      expect(orderService.findOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });
});
