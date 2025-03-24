import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { RecordFormat, RecordCategory } from './record.enum';
import { Track, TrackSchema } from './track.schema';

@Schema({ timestamps: true })
export class Record extends Document {
  @Prop({ required: true })
  @ApiProperty()
  artist: string;

  @Prop({ required: true })
  @ApiProperty()
  album: string;

  @Prop({ required: true })
  @ApiProperty()
  price: number;

  @Prop({ required: true })
  @ApiProperty()
  qty: number;

  @Prop({ enum: RecordFormat, required: true, index: true })
  @ApiProperty()
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true, index: true })
  @ApiProperty()
  category: RecordCategory;

  @Prop({ required: false })
  @ApiProperty()
  mbid?: string;

  @Prop({ type: [TrackSchema], default: [] })
  @ApiProperty()
  tracklist: Track[];
}

export type RecordDocument = Record & Document;
export const RecordSchema = SchemaFactory.createForClass(Record);

// Unique compound index for (artist, album, format)
RecordSchema.index({ artist: 1, album: 1, format: 1 }, { unique: true });

// Full-text search index for text-based queries
RecordSchema.index({ artist: 'text', album: 'text', category: 'text' });
