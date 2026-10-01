import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { LibraryItem } from '../library/library.entity.js';
import { PlayState } from './play-state.entity.js';
import { PlayStatesController } from './play-states.controller.js';
import { PlayStatesService } from './play-states.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([PlayState, LibraryItem])],
  providers: [PlayStatesService],
  controllers: [PlayStatesController],
  exports: [PlayStatesService],
})
export class PlayStatesModule {}
