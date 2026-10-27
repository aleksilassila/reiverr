import { MikroORM, RequestContext } from '@mikro-orm/core';
import { MIKRO_ORM_MODULE_OPTIONS } from '@mikro-orm/nestjs';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import mikroOrmConfig from './../src/mikro-orm.config.js';
import { UsersService } from './../src/users/users.service.js';

type TestUser = { id: string; token: string };

describe('Passwords (e2e)', () => {
  let app: INestApplication;
  let admin: TestUser;
  let viewer: TestUser;

  const signIn = (name: string, password: string) =>
    request(app.getHttpServer()).post('/auth').send({ name, password });

  const updateUser = (caller: TestUser, id: string, body: object) =>
    request(app.getHttpServer())
      .put(`/users/${id}`)
      .set('Authorization', `Bearer ${caller.token}`)
      .send(body);

  const testUserOf = (res: request.Response): TestUser => ({
    id: res.body.user.id,
    token: res.body.accessToken,
  });

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

    admin = testUserOf(await signIn('admin', 'admin').expect(200));
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'viewer', password: 'viewer', isAdmin: false })
      .expect(201);
    viewer = testUserOf(await signIn('viewer', 'viewer').expect(200));
  });

  afterEach(async () => {
    await app.close();
  });

  it('signs in with the password only', async () => {
    await signIn('viewer', 'Viewer').expect(401);
    await signIn('nobody', 'viewer').expect(401);
  });

  it('changes the password of a user with the old one only', async () => {
    await updateUser(viewer, viewer.id, { password: 'new' }).expect(400);
    await updateUser(viewer, viewer.id, {
      password: 'new',
      oldPassword: 'wrong',
    }).expect(400);
    await signIn('viewer', 'viewer').expect(200);

    await updateUser(viewer, viewer.id, {
      password: 'new',
      oldPassword: 'viewer',
    }).expect(200);
    await signIn('viewer', 'viewer').expect(401);
    await signIn('viewer', 'new').expect(200);
  });

  it('lets an admin set the password of another user without the old one', async () => {
    await updateUser(admin, viewer.id, { password: 'reset' }).expect(200);
    await signIn('viewer', 'reset').expect(200);

    await updateUser(admin, admin.id, { password: 'new' }).expect(400);
    await updateUser(viewer, admin.id, { password: 'new' }).expect(404);
    await signIn('admin', 'admin').expect(200);
  });

  describe('the admin of the environment variables', () => {
    const createOrResetAdmin = (name: string, password: string) =>
      RequestContext.create(app.get(MikroORM).em, () =>
        app.get(UsersService).createOrResetAdmin(name, password),
      );

    it('is created when no user has the name', async () => {
      await createOrResetAdmin('env', 'env');

      const res = await signIn('env', 'env').expect(200);
      expect(res.body.user.isAdmin).toBe(true);
    });

    it('gets its password back when it was changed', async () => {
      await updateUser(admin, admin.id, {
        password: 'changed',
        oldPassword: 'admin',
      }).expect(200);

      await createOrResetAdmin('admin', 'admin');
      await signIn('admin', 'changed').expect(401);
      await signIn('admin', 'admin').expect(200);
    });

    it('leaves a user that is not an admin as it is', async () => {
      await createOrResetAdmin('viewer', 'other');

      await signIn('viewer', 'other').expect(401);
      const res = await signIn('viewer', 'viewer').expect(200);
      expect(res.body.user.isAdmin).toBe(false);
    });
  });
});
