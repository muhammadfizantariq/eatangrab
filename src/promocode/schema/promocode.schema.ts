// promocode.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Promocode extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  discountPercentage: number; // e.g., 10 for 10%

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ default: null })
  usedAt: Date;

  @Prop({ default: null })
  orderId: string;
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode);
