// order.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import * as nodemailer from 'nodemailer';
import { Order } from './schema/order.schema';
import { Promocode } from 'src/promocode/schema/promocode.schema';

@Injectable()
export class OrderService {
  private stripe: Stripe;
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Promocode.name) private promocodeModel: Model<Promocode>,
  ) {
    // Validate environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(stripeSecretKey);

    // Email setup
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });
  }

  // Promocode email template
  private getPromocodeEmailTemplate(promocode: string, userEmail: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🎉 Your Exclusive Promocode - Grab & Eat</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #E30613 0%, #FFD200 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .header p { color: rgba(255,255,255,0.95); font-size: 16px; }
            .content { padding: 40px 30px; text-align: center; }
            .celebration { font-size: 50px; margin-bottom: 20px; }
            .thank-you { color: #333; font-size: 24px; margin-bottom: 15px; font-weight: bold; }
            .message { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .promocode-box { background: linear-gradient(135deg, #FFD200 0%, #FFA000 100%); border: 3px dashed #E30613; padding: 30px; border-radius: 15px; margin: 30px 0; }
            .promocode-label { color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .promocode { font-size: 36px; font-weight: bold; color: #E30613; letter-spacing: 3px; margin: 15px 0; font-family: 'Courier New', monospace; }
            .discount-info { background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #E30613; }
            .discount-info h3 { color: #E30613; margin-bottom: 15px; }
            .discount-info p { color: #333; margin-bottom: 10px; }
            .validity { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
            .cta-section { background: #E30613; color: white; padding: 25px; border-radius: 10px; margin: 25px 0; }
            .cta-button { display: inline-block; background: #FFD200; color: #333; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin-top: 15px; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Grab & Eat</h1>
              <p>Thank you for your order!</p>
            </div>
            
            <div class="content">
              <div class="celebration">🎊🎁🎊</div>
              <div class="thank-you">Thank You for Your Order!</div>
              <div class="message">
                We're excited to prepare your delicious meal! As a token of our appreciation, 
                here's an exclusive promocode just for you:
              </div>
              
              <div class="promocode-box">
                <div class="promocode-label">Your Exclusive Promocode:</div>
                <div class="promocode">${promocode}</div>
                <div style="color: #666; font-size: 14px; margin-top: 10px;">Copy this code for your next order!</div>
              </div>
              
              <div class="discount-info">
                <h3>🎯 Promocode Benefits:</h3>
                <p>• <strong>5% OFF</strong> on your next order</p>
                <p>• Valid for <strong>30 days</strong> from today</p>
              </div>
              
              <div class="validity">
                <strong>⏰ Valid Until:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}
              </div>
              
              <div class="cta-section">
                <h3>Ready to Order Again?</h3>
                <p>Use your promocode on your next delicious meal!</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu" class="cta-button">
                  Order Now 🍕
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Grab & Eat</strong> - Delicious food delivered to your door</p>
              <p>This promocode was sent to: ${userEmail}</p>
            </div>
          </div>
        </body>
        </html>
        `;
  }

  // Send promocode email
  private async sendPromocodeEmail(userEmail: string, promocode: string): Promise<void> {
    try {
      console.log('📧 Sending promocode email to:', userEmail);

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: userEmail,
        subject: `🎉 Your Exclusive 5% OFF Promocode: ${promocode} - Grab & Eat`,
        html: this.getPromocodeEmailTemplate(promocode, userEmail),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Promocode email sent:', result.messageId);

    } catch (error) {
      console.error('❌ Failed to send promocode email:', error.message);
    }
  }

  // Create and send promocode if order total > €50
  private async createAndSendPromocode(orderData: any): Promise<void> {
    try {
      const totalInEuros = orderData.totalAmount;

      if (totalInEuros > 50) {
        console.log(`💰 Order total €${totalInEuros} > €50, generating promocode...`);

        const promocode = this.generatePromocode();
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 1); // 1 month validity

        // Save promocode to database
        const newPromocode = new this.promocodeModel({
          code: promocode,
          userEmail: orderData.customerEmail,
          discountPercentage: 5, // 5% discount
          validUntil: validUntil,
          isUsed: false
        });

        await newPromocode.save();
        console.log('✅ Promocode saved to database:', promocode);

        // Send email with promocode
        await this.sendPromocodeEmail(orderData.customerEmail, promocode);
        console.log('🎉 Promocode process completed for:', orderData.customerEmail);
      } else {
        console.log(`💰 Order total €${totalInEuros} <= €50, no promocode generated`);
      }
    } catch (error) {
      console.error('❌ Failed to create/send promocode:', error.message);
    }
  }
  // Generate random promocode
  private generatePromocode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'GRAB';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  // Admin notification email template
  private getOrderNotificationTemplate(orderData: any): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Received - Grab & Eat</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 700px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #E30613 0%, #FFD200 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .header p { color: rgba(255,255,255,0.95); font-size: 18px; }
            .content { padding: 40px 30px; }
            .alert-box { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .alert-box h2 { font-size: 24px; margin-bottom: 10px; }
            .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-card { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid #E30613; }
            .info-card h3 { color: #E30613; margin-bottom: 15px; font-size: 18px; }
            .info-card p { color: #333; margin-bottom: 8px; }
            .items-section { background: #fff; border: 2px solid #E30613; border-radius: 10px; padding: 25px; margin-bottom: 25px; }
            .items-section h3 { color: #E30613; margin-bottom: 20px; text-align: center; font-size: 22px; }
            .item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; }
            .item-details h4 { color: #333; margin-bottom: 5px; }
            .item-details p { color: #666; font-size: 14px; }
            .item-price { color: #E30613; font-weight: bold; font-size: 18px; }
            .summary { background: linear-gradient(135deg, #333 0%, #444 100%); color: white; padding: 25px; border-radius: 10px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .summary-total { border-top: 2px solid #FFD200; padding-top: 15px; margin-top: 15px; font-size: 20px; font-weight: bold; }
            .action-needed { background: #FFD200; color: #333; padding: 25px; border-radius: 10px; text-align: center; margin-top: 25px; }
            .footer { background: #333; color: white; padding: 25px; text-align: center; }
            @media (max-width: 600px) { .order-info { grid-template-columns: 1fr; } }
          </style>
        </head>
        <body>
          <div class="container">
            
            <div class="content">
              <div class="alert-box">
                <h2>🚨 NEW ORDER RECEIVED!</h2>
                <p>Order ID: #${orderData._id.toString().slice(-8).toUpperCase()}</p>
              </div>
              
              <div class="order-info">
                <div class="info-card">
                  <h3>👤 Customer Information</h3>
                  <p><strong>Name:</strong> ${orderData.customerName}</p>
                  <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                  <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
                </div>
                
                <div class="info-card">
                  <h3>📍 Delivery Details</h3>
                  <p><strong>Address:</strong></p>
                  <p style="background: white; padding: 10px; border-radius: 5px; margin-top: 5px;">${orderData.deliveryAddress}</p>
                </div>
              </div>
              
              <div class="items-section">
                <h3>🛒 Order Items</h3>
                ${orderData.items.map((item: any) => `
                  <div class="item">
                    <div class="item-details">
                      <h4>${item.title}</h4>
                      <p>Quantity: ${item.quantity} × €${(item.price / 100).toFixed(2)}</p>
                    </div>
                    <div class="item-price">€${(item.total / 100).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
              
              <div class="summary">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>€${(orderData.subtotal / 100).toFixed(2)}</span>
                </div>
                <div class="summary-row summary-total">
                  <span>TOTAL AMOUNT:</span>
                  <span>€${(orderData.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <div class="action-needed">
                <h3>⚡ ACTION REQUIRED</h3>
                <p><strong>Payment Status:</strong> ${orderData.paymentStatus.toUpperCase()}</p>
                <p><strong>Order Status:</strong> ${orderData.status.toUpperCase()}</p>
                <p style="margin-top: 15px;">Please log into the admin panel to confirm and process this order!</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Grab & Eat Admin Portal</strong></p>
              <p>Order received at: ${new Date(orderData.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
        `;
  }

  // Send admin notification email
  private async sendAdminNotification(orderData: any): Promise<void> {
    try {
      console.log('📧 Sending admin notification for order:', orderData._id);

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: process.env.USER_EMAIL, // Admin email (same as sender for now)
        subject: `🚨 NEW ORDER #${orderData._id.toString().slice(-8).toUpperCase()} - €${(orderData.totalAmount / 100).toFixed(2)}`,
        html: this.getOrderNotificationTemplate(orderData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Admin notification sent:', result.messageId);

    } catch (error) {
      console.error('❌ Failed to send admin notification:', error.message);
      // Don't throw error, order should still be created
    }
  }
  async createCheckoutSession(orderData: any) {
    try {
      // Validate frontend URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Create order in database first
      const order = new this.orderModel({
        ...orderData,
        status: 'pending',
        paymentStatus: 'pending'
      });

      const savedOrder = await order.save();

      // 📧 Send admin notification immediately when order is created
      try {
        await this.sendAdminNotification(savedOrder);
        console.log('✅ Admin notification sent for new order');
      } catch (emailError) {
        console.log('❌ Failed to send admin notification:', emailError.message);
      }

      // 🎁 Create and send promocode if order total > €50
      try {
        await this.createAndSendPromocode(savedOrder);
      } catch (promocodeError) {
        console.log('❌ Failed to create/send promocode:', promocodeError.message);
      }

      console.log('savedOrder', savedOrder);

      // Create Stripe checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${frontendUrl}order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${savedOrder._id}`,
        cancel_url: `${frontendUrl}menu`,
        customer_email: orderData.customerEmail,
        line_items: orderData.items.map((item: any) => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.title,
              description: `Quantity: ${item.quantity}`,
            },
            unit_amount: item.price * 100, // Already in cents
          },
          quantity: item.quantity,
        })),
        metadata: {
          orderId: (savedOrder._id as any).toString(),
          customerName: orderData.customerName || '',
          customerPhone: orderData.customerPhone || '',
        },
      });

      // Update order with session ID
      savedOrder.stripeSessionId = session.id;
      await savedOrder.save();

      return {
        status: 'success',
        sessionId: session.id,
        orderId: savedOrder._id
      };
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async verifyPromocode(code: string, userEmail: string): Promise<{ valid: boolean; message: string; discount?: number }> {
    try {
      console.log(`🔍 Verifying promocode: ${code} for user: ${userEmail}`);

      const promocode = await this.promocodeModel.findOne({ code: code.toUpperCase() });

      if (!promocode) {
        return { valid: false, message: 'Invalid promocode' };
      }

      if (promocode.userEmail !== userEmail) {
        return { valid: false, message: 'This promocode is not valid for your account' };
      }

      if (promocode.isUsed) {
        return { valid: false, message: 'This promocode has already been used' };
      }

      if (new Date() > promocode.validUntil) {
        return { valid: false, message: 'This promocode has expired' };
      }

      console.log('✅ Promocode verified successfully');
      return {
        valid: true,
        message: 'Promocode is valid',
        discount: promocode.discountPercentage
      };

    } catch (error) {
      console.error('❌ Error verifying promocode:', error.message);
      return { valid: false, message: 'Error verifying promocode' };
    }
  }

  // Mark promocode as used
  async usePromocode(code: string, orderId: string): Promise<void> {
    try {
      await this.promocodeModel.updateOne(
        { code: code.toUpperCase() },
        {
          isUsed: true,
          usedAt: new Date(),
          orderId: orderId
        }
      );
      console.log(`✅ Promocode ${code} marked as used for order ${orderId}`);
    } catch (error) {
      console.error('❌ Error marking promocode as used:', error.message);
    }
  }


  async getOrderBySession(sessionId: string) {
    try {
      const order = await this.orderModel.findOne({ stripeSessionId: sessionId });
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }


  async getAllOrders() {
    try {
      const orders = await this.orderModel
        .find()
        .populate('items.menuItemId')
        .sort({ createdAt: -1 });

      return {
        status: 'success',
        data: orders
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch orders'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const order = await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          status: status,
          paymentStatus: status === 'confirmed' ? 'paid' : 'pending'
        },
        { new: true }
      );

      return {
        status: 'success',
        data: order
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to update order status'
      }, HttpStatus.BAD_REQUEST);
    }
  }
}