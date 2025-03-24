import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  HttpCode,
} from '@nestjs/common';
import { Record } from '../schemas/record.schema';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RecordService } from '../services/record.service';
import {
  ApiResponseDTO,
  PaginatedResponseDTO,
} from '../../../core/response.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindRecordQueryDTO } from '../dtos/find-record.query.dto';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() request: CreateRecordRequestDTO,
  ): Promise<ApiResponseDTO<Record>> {
    return this.recordService.createRecord(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Cannot find record to update' })
  @ApiResponse({ status: 500, description: 'Failed to update record' })
  async update(
    @Param('id') id: string,
    @Body() request: UpdateRecordRequestDTO,
  ): Promise<ApiResponseDTO<Record>> {
    return this.recordService.updateRecord(id, request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  async findAll(
    @Query() query?: FindRecordQueryDTO,
  ): Promise<PaginatedResponseDTO<Record>> {
    return this.recordService.findRecords(query);
  }
}
