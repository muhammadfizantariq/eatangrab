// order.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from './schema/order.schema';
import { Promocode, PromocodeSchema } from 'src/promocode/schema/promocode.schema';
import { PromocodeService } from 'src/promocode/promocode.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Promocode.name, schema: PromocodeSchema }
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService, PromocodeService],
  exports: [OrderService, PromocodeService]
})
export class OrderModule {}