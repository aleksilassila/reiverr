import { Module } from '@nestjs/common';
import { LibraryModule } from './library/library.module';
import { PlayStatesModule } from './play-state/play-states.module';
import { UserDataController } from './user-data.controller';

@Module({
  imports: [PlayStatesModule, LibraryModule],
  providers: [],
  controllers: [UserDataController],
})
export class UserDataModule {}
