import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder().build();

  // As main.ts builds it, so that the generated client has the same names
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      methodKey,
    autoTagControllers: false,
  });
  SwaggerModule.setup('openapi', app, document, {});
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
}
bootstrap();
