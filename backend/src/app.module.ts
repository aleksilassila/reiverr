import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MediaModule } from './media/media.module';
import { SourcePluginsModule } from './source-plugins/source-plugins.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../dist'),
    }),
    MediaModule,
    SourcePluginsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
