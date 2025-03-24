import { Logger } from '@nestjs/common';

export abstract class BaseService {
  protected readonly logger: Logger;

  constructor(name?: string) {
    if (name) {
      this.logger = new Logger(name);
    }
  }
}
