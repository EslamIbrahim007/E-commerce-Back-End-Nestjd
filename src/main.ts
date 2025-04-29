import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

ConfigModule.forRoot(); // Ensure env variables are loaded

console.log('🔍 JWT_SECRET_KEY:', process.env.JWT_SECRET_KEY); // Debug log

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.setGlobalPrefix('v1/api'); // Optional, set a global prefix for all route
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
