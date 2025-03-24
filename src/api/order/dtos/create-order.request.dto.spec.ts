import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderRequestDTO } from './create-order.request.dto';

describe('CreateOrderRequestDTO', () => {
  it('should convert string price and qty to numbers', async () => {
    const input = {
      recordId: 'recordId123',
      quantity: '10',
    };

    const dtoInstance = plainToInstance(CreateOrderRequestDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBe(0);
    expect(dtoInstance.quantity).toBe(10);
  });

  it('should fail validation for invalid input', async () => {
    const input = {
      recordId: 'recordId123',
      quantity: 'not-a-number',
    };

    const dtoInstance = plainToInstance(CreateOrderRequestDTO, input);
    const errors = await validate(dtoInstance);

    expect(errors.length).toBeGreaterThan(0);
  });
});
