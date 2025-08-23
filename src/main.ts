import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
// import * as os from 'os'; // No longer needed if you remove the IP logging block

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Remove payload size limits (unlimited)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve static files (for images and QR codes)
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });
  // Enable CORS for all origins, INCLUDING OPTIONS method
  app.enableCors({
    origin: '*', // Allow all origins (for now, tighten later if needed)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // <-- ADDED OPTIONS HERE
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Use process.env.PORT for Vercel, fallback to 8090 for local dev
  const port = process.env.PORT || 8090;
  await app.listen(port);
  console.log('Static files path:', join(__dirname, '..', 'uploads'));
  console.log('Current directory:', __dirname);
  // Removed the problematic IP address logging block as it's not relevant for Vercel deployment.

  console.log(`🚀 Server connected on port: ${port}`);
  console.log(`📡 Application is running on: ${await app.getUrl()}`); // NestJS's built-in way to get the URL
  console.log(`📁 Static files served at: /uploads/`);
}
bootstrap();