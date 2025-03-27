import { Module } from '@nestjs/common';
import { playStateProviders } from './play-state.providers';
import { PlayStatesController } from './play-states.controller';
import { PlayStatesService } from './play-states.service';

@Module({
  imports: [],
  providers: [...playStateProviders, PlayStatesService],
  controllers: [PlayStatesController],
  exports: [PlayStatesService],
})
export class PlayStatesModule {}
