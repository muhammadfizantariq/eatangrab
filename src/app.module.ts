import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './category/category.controller';
import { CategoryModule } from './category/category.module';
import { MenuService } from './menu/menu.service';
import { MenuModule } from './menu/menu.module';
import { ContactController } from './contact/contact.controller';
import { ContactModule } from './contact/contact.module';
import { JobApplicationModule } from './jobapplication/jobapplication.module';
import { JobApplicationService } from './jobapplication/jobapplication.service';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { OrderModule } from './order/order.module';
import { PromocodeModule } from './promocode/promocode.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI');
        console.log('📡 Connecting to MongoDB...');
        console.log('🔗 MongoDB URI:', mongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        return {
          uri: mongoUri,
        };
      },
      inject: [ConfigService],
    }),
    CategoryModule,
    MenuModule,
    ContactModule,
    JobApplicationModule,
    OrderModule,
    PromocodeModule,
  ],


})

export class AppModule { }