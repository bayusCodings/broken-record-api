import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { PaginationInputDTO } from '../../../core/pagination.input.dto';

export class FindRecordQueryDTO extends PaginationInputDTO {
  @ApiPropertyOptional({
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by artist name', type: String })
  @IsOptional()
  @IsString()
  artist?: string;

  @ApiPropertyOptional({ description: 'Filter by album name', type: String })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiPropertyOptional({
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
  })
  @IsOptional()
  @IsEnum(RecordFormat)
  format?: RecordFormat;

  @ApiPropertyOptional({
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
  })
  @IsOptional()
  @IsEnum(RecordCategory)
  category?: RecordCategory;
}
