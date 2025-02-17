import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { UsersService } from './users/users.service';
import { ADMIN_PASSWORD, ADMIN_USERNAME, ENV } from './consts';
import { json, urlencoded } from 'express';
// import * as proxy from 'express-http-proxy';
require('ts-node/register'); // For importing plugins

async function createAdminUser(userService: UsersService) {
  if (!ADMIN_USERNAME || ADMIN_PASSWORD === undefined) return;

  const existingUser = await userService.findOneByName(ADMIN_USERNAME);

  if (!existingUser) {
    await userService.create({
      name: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      isAdmin: true,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'error',
      'warn',
      'log',
      ...(ENV === 'development' ? (['debug'] as const) : []),
    ],
  });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  if (ENV === 'development') {
    console.log('Creating OpenAPI specification...');

    const config = new DocumentBuilder().build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup('openapi', app, document);
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  }

  await createAdminUser(app.get(UsersService));

  await app.listen(9494);
  console.log(
    `Application is running on: ${await app.getUrl()} in ${ENV} mode`,
  );
}

bootstrap();
