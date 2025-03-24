import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationInputDTO } from '../../../core/pagination.input.dto';

export class FindOrderQueryDTO extends PaginationInputDTO {
  @ApiPropertyOptional({
    description: 'Filter by record ID',
    type: String,
  })
  @IsOptional()
  @IsString()
  recordId?: string;
}
