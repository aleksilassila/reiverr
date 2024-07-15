import { Module } from '@nestjs/common';
import { PlayStateService } from './play-state.service';
import { playStateProviders } from './play-state.providers';
import { PlayStateController } from './play-state.controller';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [PlayStateService, ...playStateProviders],
  controllers: [PlayStateController],
})
export class PlayStateModule {}
