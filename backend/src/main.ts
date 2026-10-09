import { MikroORM, RequestContext } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { UsersService } from './users/users.service.js';
import { ADMIN_PASSWORD, ADMIN_USERNAME, ENV } from './consts.js';
import { json, urlencoded } from 'express';

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
    // logger: [
    //   'error',
    //   'warn',
    //   'log',
    //   ...(ENV === 'development' ? (['debug'] as const) : []),
    // ],
  });
  const orm = app.get(MikroORM);
  await orm.migrator.up();

  // So that a stop signal stores the transfer counters and stops the torrents
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use('/test', (req, res, next) => {
    res.send('Test successful');
    next();
  });

  if (ENV === 'development') {
    console.log('Creating OpenAPI specification...');

    const config = new DocumentBuilder().build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
      autoTagControllers: false,
    });

    SwaggerModule.setup('openapi', app, document);
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  }

  await RequestContext.create(orm.em, () =>
    createAdminUser(app.get(UsersService)),
  );

  await app.listen(9494);
  console.log(
    `Application is running on: ${await app.getUrl()} in ${ENV} mode`,
  );
}

await bootstrap();
