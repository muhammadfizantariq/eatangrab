import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ timestamps: true })
export class Menu {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  desc?: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: false, default: false })
  combo?: boolean;

  @Prop({ required: false, default: '' })
  image?: string; // This will store the file path

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ required: false, default: true })
  isAvailable?: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);