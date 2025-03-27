import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware as AuthMiddleware } from './auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MediaSourcesModule } from './media-sources/media-sources.module';
import { MetadataModule } from './metadata/metadata.module';
import { SourceProvidersModule } from './source-providers/source-providers.module';
import { UserDataModule } from './user-data/user-data.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../dist'),
    }),
    MetadataModule,
    SourceProvidersModule,
    MediaSourcesModule,
    UserDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
