import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // Enable cookie parser
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true, // IMPORTANT: Allow cookies to be sent
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
