import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MyListModule } from './users/my-list/my-list.module';
import { PlayStateModule } from './users/play-state/play-state.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    MyListModule,
    PlayStateModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../dist'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
