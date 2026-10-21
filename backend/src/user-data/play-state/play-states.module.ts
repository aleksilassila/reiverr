import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RequestsModule } from '../../requests/requests.module.js';
import { MyListItem } from '../my-list/my-list-item.entity.js';
import { PlayState } from './play-state.entity.js';
import { PlayStatesController } from './play-states.controller.js';
import { PlayStatesService } from './play-states.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([PlayState, MyListItem]), RequestsModule],
  providers: [PlayStatesService],
  controllers: [PlayStatesController],
  exports: [PlayStatesService],
})
export class PlayStatesModule {}
