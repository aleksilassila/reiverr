import { Module } from '@nestjs/common';
import { LibraryModule } from './library/library.module.js';
import { PlayStatesModule } from './play-state/play-states.module.js';
import { UserDataController } from './user-data.controller.js';

@Module({
  imports: [PlayStatesModule, LibraryModule],
  providers: [],
  controllers: [UserDataController],
})
export class UserDataModule {}
