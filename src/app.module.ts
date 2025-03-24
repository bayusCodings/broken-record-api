import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RecordModule } from './api/record/record.module';
import { OrderModule } from './api/order/order.module';
import { AppConfig } from './app.config';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
    }),
    MongooseModule.forRoot(AppConfig.mongoUrl),
    RecordModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
