import { ApiProperty } from '@nestjs/swagger';
import { PaginationDTO } from './pagination.dto';

export class ApiResponseDTO<T> {
  @ApiProperty()
  data?: T;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  success?: boolean;
}

export class PaginatedResponseDTO<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  pagination: PaginationDTO;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function asApiResponse<T>(
  data?: T,
  message?: string,
  success: boolean = true,
): ApiResponseDTO<T> {
  return {
    success,
    message,
    data: data ?? null,
  };
}

export function asPaginatedResponse<T>(
  data: T[],
  pagination: PaginationDTO,
): PaginatedResponseDTO<T> {
  return {
    data,
    pagination,
  };
}
