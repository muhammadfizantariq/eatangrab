// src/promocode/promocode.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromocodeController } from './promocode.controller';
import { PromocodeService } from './promocode.service';
import { Promocode, PromocodeSchema } from './schema/promocode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promocode.name, schema: PromocodeSchema }
    ])
  ],
  controllers: [PromocodeController],
  providers: [PromocodeService],
  exports: [PromocodeService]
})
export class PromocodeModule {}