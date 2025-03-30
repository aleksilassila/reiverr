import { Module } from '@nestjs/common';
import { playStateProviders } from './play-state.providers';
import { PlayStatesController } from './play-states.controller';
import { PlayStatesService } from './play-states.service';
import { libraryProviders } from '../library/library.providers';

@Module({
  imports: [],
  providers: [...playStateProviders, ...libraryProviders, PlayStatesService],
  controllers: [PlayStatesController],
  exports: [PlayStatesService],
})
export class PlayStatesModule {}
