import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { PaginatedResult } from '../../../core/response.dto';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { FindOrderQueryDTO } from '../dtos/find-order.query.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
  ) {}

  async create(
    orderData: CreateOrderRequestDTO,
    session?: ClientSession,
  ): Promise<Order> {
    const [order] = await this.orderModel.create([orderData], { session });
    return order;
  }

  async findById(id: string, session?: ClientSession): Promise<Order | null> {
    return this.orderModel
      .findById(id)
      .session(session || null)
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Order>,
    session?: ClientSession,
  ): Promise<Order | null> {
    return this.orderModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .session(session || null)
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findOrders(query: FindOrderQueryDTO): Promise<PaginatedResult<Order>> {
    const { page, size, recordId } = query;

    const filter: any = {};
    if (recordId) filter.recordId = recordId;

    const skip = (page - 1) * size;

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate({ path: 'recordId', select: 'artist album format' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async deleteMany(): Promise<void> {
    await this.orderModel.deleteMany()
  }
}
