import { MediaTypeFull } from '../../common/common.dto.js';

/** A movie or an episode became watched or unwatched */
export const WATCH_STATUS_CHANGED = 'play-state.watch-status-changed';

export interface WatchStatusChangedEvent {
  userId: string;
  tmdbId: string;
  mediaType: MediaTypeFull;
}
