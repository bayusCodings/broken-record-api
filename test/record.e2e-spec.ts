import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import {
  Record,
  RecordDocument,
} from '../src/api/record/schemas/record.schema';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/record/schemas/record.enum';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  let recordId: string;
  let recordModel: Model<RecordDocument>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    recordModel = app.get(getModelToken(Record.name));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  // Test to create a record
  it('should create a new record', async () => {
    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = response.body.data._id;
    expect(response.body.data).toHaveProperty('artist', 'The Beatles');
    expect(response.body.data).toHaveProperty('album', 'Abbey Road');
  });

  it('should create a new record and fetch it with filters', async () => {
    const createRecordDto = {
      artist: 'The Fake Band',
      album: 'Fake Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createResponse.body.data._id;

    const response = await request(app.getHttpServer())
      .get('/records?artist=The Fake Band')
      .expect(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Fake Band');
  });

  it('should fetch paginated records', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?page=1&size=10')
      .expect(200);

    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('page', 1);
    expect(response.body.pagination).toHaveProperty('size', 10);
  });

  it('should create a new record and update it successfully', async () => {
    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createResponse.body.data._id;

    const updateRecordDto = {
      album: 'Abbey Road - Remastered',
      price: 30,
    };

    const response = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(200);

    expect(response.body.data).toHaveProperty(
      'album',
      'Abbey Road - Remastered',
    );
    expect(response.body.data).toHaveProperty('price', 30);
  });

  it('should return 404 when updating a non-existent record', async () => {
    const updateRecordDto = {
      album: 'Ghost Album',
    };

    await request(app.getHttpServer())
      .put('/records/605c72d1b58c2a23d4c3bdb4') // Non-existent ID
      .send(updateRecordDto)
      .expect(404);
  });

  it('should return 400 when creating a record with invalid data', async () => {
    const invalidRecordDto = {
      artist: '', // Empty artist (invalid)
      album: 'Unknown Album',
      price: -10, // Negative price (invalid)
      qty: 5,
      format: RecordFormat.CD,
      category: RecordCategory.POP,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(invalidRecordDto)
      .expect(400);

    expect(response.body.message).toContain('artist should not be empty');
    expect(response.body.message).toContain('price must not be less than 1');
  });

  afterEach(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
