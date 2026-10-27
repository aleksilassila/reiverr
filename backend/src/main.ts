import { MikroORM, RequestContext } from '@mikro-orm/core';
import { ShutdownSignal } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { JobsService } from './jobs/jobs.service.js';
import { UsersService } from './users/users.service.js';
import { ADMIN_PASSWORD, ADMIN_USERNAME, ENV } from './consts.js';
import { json, urlencoded } from 'express';

async function createAdminUser(userService: UsersService) {
  if (!ADMIN_USERNAME || ADMIN_PASSWORD === undefined) return;

  await userService.createOrResetAdmin(ADMIN_USERNAME, ADMIN_PASSWORD);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // A stop does not wait for the players to close their streams, and
    // requests that arrive while it stops are refused
    forceCloseConnections: true,
    return503OnClosing: true,
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
  app.enableShutdownHooks([ShutdownSignal.SIGTERM, ShutdownSignal.SIGINT]);
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
  // A second process on the same port has failed by now, before it touched
  // the jobs of this one
  await app.get(JobsService).start();
  console.log(
    `Application is running on: ${await app.getUrl()} in ${ENV} mode`,
  );
}

await bootstrap();
