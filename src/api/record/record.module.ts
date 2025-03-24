import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Record, RecordSchema } from './schemas/record.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../shared/shared.module';
import { RecordController } from './controllers/record.controller';
import { RecordCache } from './cache/record.cache';
import { RecordService } from './services/record.service';
import { RecordRepository } from './repositories/record.repository';
import { MusicBrainzService } from './integrations/musicbrainz.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Record.name, schema: RecordSchema }]),
    HttpModule,
    SharedModule,
  ],
  controllers: [RecordController],
  providers: [RecordCache, RecordService, RecordRepository, MusicBrainzService],
  exports: [RecordCache, RecordRepository],
})
export class RecordModule {}
