import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiResponseDTO,
  asApiResponse,
  asPaginatedResponse,
  PaginatedResponseDTO,
} from '../../../core/response.dto';
import { ClientSession } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { RecordCache } from '../../record/cache/record.cache';
import { OrderRepository } from '../repositories/order.repository';
import { RecordRepository } from '../../record/repositories/record.repository';
import { BaseService } from '../../../core/base/base.service';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { FindOrderQueryDTO } from '../dtos/find-order.query.dto';

@Injectable()
export class OrderService extends BaseService {
  constructor(
    private readonly recordCache: RecordCache,
    private readonly orderRepository: OrderRepository,
    private readonly recordRepository: RecordRepository,
  ) {
    super(OrderService.name);
  }

  async createOrder(
    orderData: CreateOrderRequestDTO,
  ): Promise<ApiResponseDTO<Order>> {
    const session: ClientSession = await this.recordRepository.startSession();
    session.startTransaction();

    try {
      const record = await this.recordRepository.findById(
        orderData.recordId,
        session,
      );

      if (!record) throw new NotFoundException('Record not found');

      if (record.qty < orderData.quantity) {
        throw new ConflictException('Not enough stock available');
      }

      const order = await this.orderRepository.create(orderData, session);

      // Deduct stock
      const updates = { qty: record.qty - orderData.quantity };
      await this.recordRepository.update(record.id, updates, session);
      await this.recordCache.clearRecords();

      await session.commitTransaction();
      await session.endSession();

      return asApiResponse(order);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(`[Error creating order] ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'An error occured while creating order',
      );
    }
  }

  async findOrders(
    query: FindOrderQueryDTO,
  ): Promise<PaginatedResponseDTO<Order>> {
    try {
      const { page, size } = query;
      const { data, total } = await this.orderRepository.findOrders(query);

      const response = asPaginatedResponse(
        data,
        new PaginationDTO(page, size, total),
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[Error finding records] ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occured while finding orders',
      );
    }
  }
}
