import { Module } from '@nestjs/common';
import { PlayStatesService } from './play-states.service';
import { PlayStatesController as PlayStatesController } from './play-states.controller';
import { playStateProviders } from './play-state.providers';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [...playStateProviders, PlayStatesService],
  controllers: [PlayStatesController],
  imports: [UsersModule],
  exports: [PlayStatesService],
})
export class PlayStatesModule {}
