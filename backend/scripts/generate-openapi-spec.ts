import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder().build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('openapi', app, document, {});
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
}
bootstrap();
