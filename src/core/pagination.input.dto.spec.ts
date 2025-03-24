import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationInputDTO } from './pagination.input.dto';

describe('PaginationInputDTO', () => {
  it('should convert string page and size to numbers', async () => {
    const input = {
      page: '1',
      size: '10',
    };

    const dtoInstance = plainToInstance(PaginationInputDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBe(0);
    expect(dtoInstance.page).toBe(1);
    expect(dtoInstance.size).toBe(10);
  });

  it('should fail validation for invalid input', async () => {
    const input = {
      page: 'not-a-number',
      size: 'not-a-number',
    };

    const dtoInstance = plainToInstance(PaginationInputDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBeGreaterThan(0);
  });
});
