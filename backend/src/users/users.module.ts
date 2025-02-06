import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { UserSourcesService } from './user-sources/user-sources.service';
import { UserSourcesController } from './user-sources/user-sources.controller';
import { LibraryService } from './library/library.service';
import { PlayStateService } from './play-state/play-state.service';
import { LibraryController } from './library/library.controller';
import { PlayStateController } from './play-state/play-state.controller';
import { SourcePluginsModule } from 'src/source-plugins/source-plugins.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => SourcePluginsModule)],
  providers: [
    ...userProviders,
    UsersService,
    UserSourcesService,
    LibraryService,
    PlayStateService,
  ],
  controllers: [
    UsersController,
    UserSourcesController,
    LibraryController,
    PlayStateController,
  ],
  exports: [UsersService, UserSourcesService, LibraryService],
})
export class UsersModule {}
