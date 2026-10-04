import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthMiddleware as AuthMiddleware } from './auth/auth.middleware.js';
import { AuthModule } from './auth/auth.module.js';
import { MetadataModule } from './metadata/metadata.module.js';
import { UserDataModule } from './user-data/user-data.module.js';
import { UsersModule } from './users/users.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { LocalMediaModule } from './local-media/local-media.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { IndexersModule } from './indexers/indexers.module.js';
import { DownloadsModule } from './downloads/downloads.module.js';
import { ServerLogModule } from './server-log/server-log.module.js';
import { ServerModule } from './server/server.module.js';
import { DEV } from './consts.js';
import mikroOrmConfig from './mikro-orm.config.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
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
    LocalMediaModule,
    JobsModule,
    IndexersModule,
    DownloadsModule,
    ServerLogModule,
    ServerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('{*path}');
  }
}
