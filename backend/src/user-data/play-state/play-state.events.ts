import { PlayState } from './play-state.entity';

export const PLAY_STATE_UPDATED = 'play-state.updated';

export class PlayStateUpdatedEvent {
  userId: string;
  tmdbId: string;
  playState: PlayState;
}
