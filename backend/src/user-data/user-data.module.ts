import { Module } from '@nestjs/common';
import { LibraryModule } from './library/library.module';
import { PlayStatesModule } from './play-state/play-states.module';
import { UserDataController } from './user-data.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [],
  controllers: [UserDataController],
  imports: [PlayStatesModule, LibraryModule, UsersModule],
})
export class UserDataModule {}
