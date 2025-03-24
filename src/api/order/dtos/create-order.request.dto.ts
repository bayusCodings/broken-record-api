import { IsString, IsNotEmpty, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'The record id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of the record being ordered',
    type: Number,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
