import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware as AuthMiddleware } from './auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MetadataModule } from './metadata/metadata.module';
import { SourceProvidersModule } from './source-providers/source-providers.module';
import { UserDataModule } from './user-data/user-data.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MediaModule } from './media/media.module';
import { RequestsModule } from './requests/requests.module';
import { MediaRequestsModule } from './media-requests/media-requests.module';
import { CataloguesModule } from './catalogues/catalogues.module';
import { ProxyModule } from './proxy/proxy.module';
import { LocalMediaModule } from './local-media/local-media.module';
import { DEV } from './consts';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: DEV
        ? join(__dirname, '../../../frontend/dist')
        : join(__dirname, '../dist'),
    }),
    MetadataModule,
    SourceProvidersModule,
    UserDataModule,
    PermissionsModule,
    MediaModule,
    RequestsModule,
    MediaRequestsModule,
    CataloguesModule,
    ProxyModule,
    LocalMediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
