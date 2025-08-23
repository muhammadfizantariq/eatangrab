import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express'; // CHANGED THIS LINE!

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      logger: ['error', 'warn', 'log', 'verbose', 'debug'],
    }
  );

  // const allowedOrigins = [
  //   'http://localhost:3000',
  //   'http://localhost:5173',
  //   'https://sadamritsar-frontend.vercel.app',
  //   'https://sadamritsar-frontend-alis-projects-66f6d7ef.vercel.app',
  //   'https://sadamritsar-frontend-git-main-alis-projects-66f6d7ef.vercel.app',
  // ];

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true);
  //     } else {
  //       console.warn(`CORS blocked for origin: ${origin}`);
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   credentials: true,
  // });

  await app.init();
  return server;
}

export default async (req, res) => {
  const app = await bootstrap();
  app(req, res);
};