import { MikroORM } from '@mikro-orm/core';
import { MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import mikroOrmConfig from './../src/mikro-orm.config.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MIKRO_ORM_MODULE_OPTIONS)
      .useValue({ ...mikroOrmConfig, dbName: ':memory:' })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.get(MikroORM).migrator.up();
    await app.init();
  });

  it('starts, and answers an unknown route with 404', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
