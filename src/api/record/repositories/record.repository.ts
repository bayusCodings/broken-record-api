import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { PaginatedResult } from '../../../core/response.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';

@Injectable()
export class RecordRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(
    recordData: CreateRecordRequestDTO,
    session?: ClientSession,
  ): Promise<Record> {
    const [record] = await this.recordModel.create([recordData], { session });
    return record;
  }

  async findById(id: string, session?: ClientSession): Promise<Record | null> {
    return this.recordModel
      .findById(id)
      .session(session || null)
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Record>,
    session?: ClientSession,
  ): Promise<Record | null> {
    return this.recordModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .session(session || null)
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.recordModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findRecords(
    query: FindRecordQueryDTO,
  ): Promise<PaginatedResult<Record>> {
    const { page, size, q, artist, album, format, category } = query;

    const filter: any = {};
    if (q) filter.$text = { $search: q };
    if (artist) filter.artist = { $regex: artist, $options: 'i' };
    if (album) filter.album = { $regex: album, $options: 'i' };
    if (format) filter.format = format;
    if (category) filter.category = category;

    const skip = (page - 1) * size;

    const [data, total] = await Promise.all([
      this.recordModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.recordModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async deleteMany(): Promise<void> {
    await this.recordModel.deleteMany()
  }

  async startSession() {
    return this.recordModel.db.startSession();
  }
}
