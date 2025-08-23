// Updated order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ required: true })
  deliveryAddress: string;

  @Prop([{
    menuItemId: { type: Types.ObjectId, ref: 'Menu', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true }
  }])
  items: Array<{
    menuItemId: Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
    total: number;
  }>;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ required: true })
  totalAmount: number;

  // Promocode related fields
  @Prop({ default: null })
  promocodeUsed: string;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ default: null })
  originalTotal: number;

  @Prop({ 
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Prop({ 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  })
  paymentStatus: string;

  @Prop()
  stripeSessionId: string;

  @Prop()
  stripePaymentIntentId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);