import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RecordService } from './src/api/record/services/record.service';
import { RecordRepository } from './src/api/record/repositories/record.repository';
import { OrderRepository } from './src/api/order/repositories/order.repository';
import * as fs from 'fs';
import * as readline from 'readline';

async function setupDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const recordService = app.get(RecordService);
  const recordRepository = app.get(RecordRepository)
  const orderRepository = app.get(OrderRepository);

  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      'Do you want to clean up the existing records? (Y/N): ',
      async (answer) => {
        rl.close();

        const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
        
        if (answer.toLowerCase() === 'y') {
          await Promise.all([
            recordRepository.deleteMany(),
            orderRepository.deleteMany()
          ])
          console.log('Existing records cleaned up.');
        }

        for (const record of data) {
          await recordService.createRecord(record);
        }

        console.log(`Inserted ${data.length} records successfully!`);
        await app.close();
        process.exit(0);
      },
    );
  } catch (error) {
    console.error('Error setting up the database:', error);
    await app.close();
    process.exit(1);
  }
}

setupDatabase();