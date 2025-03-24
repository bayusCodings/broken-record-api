import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { CreateRecordRequestDTO } from './create-record.request.dto';

describe('CreateRecordRequestDTO', () => {
  it('should convert string price and qty to numbers', async () => {
    const input = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: '30',
      qty: '10',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const dtoInstance = plainToInstance(CreateRecordRequestDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBe(0);
    expect(dtoInstance.price).toBe(30);
    expect(dtoInstance.qty).toBe(10);
  });

  it('should fail validation for invalid input', async () => {
    const input = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 'not-a-number',
      qty: 'invalid-qty',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const dtoInstance = plainToInstance(CreateRecordRequestDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBeGreaterThan(0);
  });
});
