import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { Order, OrderDocument } from '../src/api/order/schemas/order.schema';
import {
  Record,
  RecordDocument,
} from '../src/api/record/schemas/record.schema';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/record/schemas/record.enum';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let orderModel: Model<OrderDocument>;
  let recordModel: Model<RecordDocument>;
  let recordId: string;
  let orderId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    orderModel = app.get(getModelToken(Order.name));
    recordModel = app.get(getModelToken(Record.name));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    // Create a record to use in tests
    const record = await recordModel.create({
      artist: 'Test Artist',
      album: 'Test Album',
      price: 20,
      qty: 5,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    });
    recordId = record._id.toString();
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        recordId,
        quantity: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201);

      orderId = response.body.data._id;
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.recordId).toBe(orderData.recordId);
      expect(response.body.data.quantity).toBe(orderData.quantity);
    });

    it('should return 404 if record does not exist', async () => {
      const orderData = {
        recordId: '60c72b2f5f1b2c001c8e4d5d', // Non-existent ID
        quantity: 2,
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(404);
    });

    it('should return 400 when creating an order with invalid data', async () => {
      const invalidOrderDto = {
        recordId: '', // Empty recordId (invalid)
        qty: 2,
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(invalidOrderDto)
        .expect(400);
    });

    it('should return 409 if order quantity exceeds available stock', async () => {
      const orderData = { recordId, quantity: 100 };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(409);

      expect(response.body.message).toBe('Not enough stock available');
    });
  });

  describe('GET /orders', () => {
    it('should return a list of orders', async () => {
      const query = { page: 1, size: 10 };

      const response = await request(app.getHttpServer())
        .get('/orders')
        .query(query)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('size', 10);
    });
  });

  afterEach(async () => {
    await orderModel.findByIdAndDelete(orderId);
    await recordModel.findByIdAndDelete(recordId);
  });

  afterAll(async () => {
    await app.close();
  });
});
