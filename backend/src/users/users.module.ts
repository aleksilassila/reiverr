import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { LibraryModule } from './library/library.module';
import { PlayStateModule } from './play-state/play-state.module';
import { UserSourcesService } from './user-sources/user-sources.service';

@Module({
  imports: [DatabaseModule, LibraryModule, PlayStateModule],
  providers: [...userProviders, UsersService, UserSourcesService],
  controllers: [UsersController],
  exports: [UsersService, UserSourcesService],
})
export class UsersModule {}
