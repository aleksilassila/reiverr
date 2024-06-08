import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { UserService } from './user/user.service';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './consts';
// import * as proxy from 'express-http-proxy';

async function createAdminUser(userService: UserService) {
  if (!ADMIN_USERNAME || ADMIN_PASSWORD === undefined) return;

  const existingUser = await userService.findOneByName(ADMIN_USERNAME);

  if (!existingUser) {
    await userService.create(ADMIN_USERNAME, ADMIN_PASSWORD, true);
  }
}

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

  await createAdminUser(app.get(UserService));

  await app.listen(9494);
}

bootstrap();
