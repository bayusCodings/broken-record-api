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
import { MongoServerError } from 'mongodb';
import { Track } from '../schemas/track.schema';
import { Record } from '../schemas/record.schema';
import { RecordCache } from '../cache/record.cache';
import { RecordRepository } from '../repositories/record.repository';
import { BaseService } from '../../../core/base/base.service';
import { MusicBrainzService } from '../integrations/musicbrainz.service';
import { PaginationDTO } from '../../../core/pagination.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';

@Injectable()
export class RecordService extends BaseService {
  constructor(
    private readonly recordCache: RecordCache,
    private readonly recordRepository: RecordRepository,
    private readonly musicBrainzService: MusicBrainzService,
  ) {
    super(RecordService.name);
  }

  async createRecord(
    request: CreateRecordRequestDTO,
  ): Promise<ApiResponseDTO<Record>> {
    try {
      const { mbid, ...recordData } = request;
      const record = await this.recordRepository.create(recordData);

      if (mbid) {
        const tracklist = await this.handleTracklistUpdate(
          record._id.toString(),
          mbid,
        );
        record.tracklist = tracklist;
      }

      await this.recordCache.clearRecords();
      return asApiResponse(record);
    } catch (error) {
      this.handleMongoDuplicateError(error);

      this.logger.error(
        `[Error creating record] ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occured while creating record',
      );
    }
  }

  async updateRecord(
    id: string,
    request: UpdateRecordRequestDTO,
  ): Promise<ApiResponseDTO<Record>> {
    try {
      const record = await this.recordRepository.findById(id);
      if (!record) throw new NotFoundException('Record not found');

      const { mbid, ...updates } = request;
      const updatedRecord = await this.recordRepository.update(id, updates);

      if (mbid && mbid !== record.mbid) {
        const tracklist = await this.handleTracklistUpdate(id, mbid);
        if (tracklist.length) updatedRecord.tracklist = tracklist;
      }

      await this.recordCache.clearRecords();
      return asApiResponse(updatedRecord);
    } catch (error) {
      this.handleMongoDuplicateError(error);
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `[Error updating record] ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occured while updating record',
      );
    }
  }

  async findRecords(
    query: FindRecordQueryDTO,
  ): Promise<PaginatedResponseDTO<Record>> {
    try {
      const cachedData = await this.recordCache.getRecords(query);
      if (cachedData) return cachedData;

      const { page, size } = query;
      const { data, total } = await this.recordRepository.findRecords(query);

      const response = asPaginatedResponse(
        data,
        new PaginationDTO(page, size, total),
      );
      await this.recordCache.setRecords(query, response);

      return response;
    } catch (error) {
      this.logger.error(
        `[Error finding records] ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occured while finding records',
      );
    }
  }

  async handleTracklistUpdate(
    recordId: string,
    mbid: string,
  ): Promise<Track[]> {
    try {
      const tracklist = await this.getOrFetchTracklist(mbid);
      if (tracklist.length) {
        await this.recordRepository.update(recordId, { mbid, tracklist });
      }
      return tracklist;
    } catch (error) {
      this.logger.error(
        `[Failed to update tracklist for record ${recordId}] ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async getOrFetchTracklist(mbid: string): Promise<Track[]> {
    let tracklist = await this.recordCache.getTracklist(mbid);
    if (tracklist) return tracklist;

    tracklist = await this.musicBrainzService.fetchTrackList(mbid);
    if (!tracklist.length) return [];

    await this.recordCache.setTracklist(mbid, tracklist);
    return tracklist;
  }

  private handleMongoDuplicateError(error: any): void {
    if (error instanceof MongoServerError && error.code === 11000) {
      const { artist, album, format } = error.keyValue;
      throw new ConflictException(
        `Record already exists: ${artist} - ${album} (${format})`,
      );
    }
  }
}
