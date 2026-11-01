import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { PlayState } from './play-state.entity.js';
import { PlayStatesService } from './play-states.service.js';
import { TitleState } from './title-state.entity.js';
import { TitleStateService } from './title-state.service.js';
import { UserDataController } from './user-data.controller.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([PlayState, TitleState]),
    RequestsModule,
    MetadataModule,
  ],
  providers: [PlayStatesService, TitleStateService],
  controllers: [UserDataController],
  exports: [PlayStatesService, TitleStateService],
})
export class UserDataModule {}
