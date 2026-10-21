import { Module } from '@nestjs/common';
import { MyListModule } from './my-list/my-list.module.js';
import { PlayStatesModule } from './play-state/play-states.module.js';
import { UserDataController } from './user-data.controller.js';

@Module({
  imports: [PlayStatesModule, MyListModule],
  providers: [],
  controllers: [UserDataController],
})
export class UserDataModule {}
