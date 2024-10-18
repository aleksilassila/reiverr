import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MyListModule } from './users/my-list/my-list.module';
import { TitleModule } from './users/titles/title.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    MyListModule,
    TitleModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../dist'),
    }),
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
