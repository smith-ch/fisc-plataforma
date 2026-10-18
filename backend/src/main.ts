import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { UPLOAD_DIR } from './uploads/upload.options';

async function bootstrap() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  Logger.log(`API lista en http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
