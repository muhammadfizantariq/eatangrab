// order.controller.ts
import { Controller, Post, Body, Get, Query, Headers, RawBody } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() orderData: any) {
    return await this.orderService.createCheckoutSession(orderData);
  }

  @Get('success')
  async getOrderSuccess(@Query('session_id') sessionId: string) {
    return await this.orderService.getOrderBySession(sessionId);
  }

   @Post('verify-promocode')
  async verifyPromocode(@Body() body: { code: string; userEmail: string }) {
    const { code, userEmail } = body;
    
    if (!code || !userEmail) {
      return {
        valid: false,
        message: 'Promocode and user email are required'
      };
    }

    return await this.orderService.verifyPromocode(code, userEmail);
  }
}