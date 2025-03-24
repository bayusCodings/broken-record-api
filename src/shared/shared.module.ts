import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [RedisModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class SharedModule {}
