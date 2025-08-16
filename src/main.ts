// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as cookieParser from "cookie-parser"

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.use(cookieParser()); // Enable cookie parser
//   app.enableCors({
//     origin: 'http://localhost:3000',
//     credentials: true, // IMPORTANT: Allow cookies to be sent
//   });
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as compression from 'compression';
import compression from 'compression';

import helmet from 'helmet';
import { AppModule } from './app.module';
// import * as cookieParser from 'cookie-parser';
import cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Security
  app.use(helmet());

  // Compression
  app.use(compression());
  app.use(cookieParser()); // Enable cookie parser

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Add Kafka microservice to the same app
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'] },
      consumer: { groupId: 'video-workers' },
    },
  });

  await app.startAllMicroservices();

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Price Tracker API')
    .setDescription('API for tracking prices from Amazon and Flipkart')
    .setVersion('1.0')
    .addTag('tracker')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
