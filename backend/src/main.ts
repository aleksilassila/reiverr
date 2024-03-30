import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as proxy from 'express-http-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  // app.use('/api/proxy/jellyfin', proxy('http://192.168.0.129:8096'));

  const config = new DocumentBuilder().build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('openapi', app, document);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));

  await app.listen(3000);
}
bootstrap();
