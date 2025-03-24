import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationInputDTO {
  @ApiPropertyOptional({ description: 'page', type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'size', type: Number })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(10)
  size?: number = 10;
}
