import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { LibraryModule } from './library/library.module';
import { PlayStateModule } from './play-state/play-state.module';
import { UserSourcesService } from './user-sources/user-sources.service';
import { UserSourcesController } from './user-sources/user-sources.controller';

@Module({
  imports: [DatabaseModule, LibraryModule, PlayStateModule],
  providers: [...userProviders, UsersService, UserSourcesService],
  controllers: [UsersController, UserSourcesController],
  exports: [UsersService, UserSourcesService],
})
export class UsersModule {}
