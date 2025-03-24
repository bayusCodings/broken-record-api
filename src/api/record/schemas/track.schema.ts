import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Track extends Document {
  @Prop({ required: true })
  @ApiProperty()
  position: number;

  @Prop({ required: true })
  @ApiProperty()
  title: string;

  @Prop({ required: true })
  @ApiProperty()
  length: number;

  @Prop({ required: true })
  @ApiProperty()
  firstReleaseDate: string;
}

export const TrackSchema = SchemaFactory.createForClass(Track);
