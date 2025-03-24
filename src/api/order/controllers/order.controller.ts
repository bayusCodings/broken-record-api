import { Controller, Post, Body, HttpCode, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Order } from '../schemas/order.schema';
import { OrderService } from '../services/order.service';
import { PaginatedResponseDTO } from '../../../core/response.dto';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { FindOrderQueryDTO } from '../dtos/find-order.query.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async create(@Body() request: CreateOrderRequestDTO) {
    return this.orderService.createOrder(request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [Order],
  })
  async findAll(
    @Query() query?: FindOrderQueryDTO,
  ): Promise<PaginatedResponseDTO<Order>> {
    return this.orderService.findOrders(query);
  }
}
