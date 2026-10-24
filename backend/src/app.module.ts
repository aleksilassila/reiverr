import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthMiddleware as AuthMiddleware } from './auth/auth.middleware.js';
import { AuthModule } from './auth/auth.module.js';
import { MetadataModule } from './metadata/metadata.module.js';
import { UserDataModule } from './user-data/user-data.module.js';
import { UsersModule } from './users/users.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { LibraryModule } from './library/library.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { IndexersModule } from './indexers/indexers.module.js';
import { DownloadsModule } from './downloads/downloads.module.js';
import { ServerLogModule } from './server-log/server-log.module.js';
import { ServerModule } from './server/server.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { DEV } from './consts.js';
import mikroOrmConfig from './mikro-orm.config.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MikroOrmModule.forRoot(mikroOrmConfig),
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: DEV
        ? join(import.meta.dirname, '../../../frontend/dist')
        : join(import.meta.dirname, '../dist'),
    }),
    MetadataModule,
    UserDataModule,
    RequestsModule,
    LibraryModule,
    JobsModule,
    IndexersModule,
    DownloadsModule,
    ServerLogModule,
    ServerModule,
    CatalogModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('{*path}');
  }
}
