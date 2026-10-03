import { MediaTypeFull } from '../common/common.dto.js';

export const REQUESTS_CHANGED = 'requests.changed';

export interface RequestsChangedEvent {
  tmdbId: string;
  mediaType: MediaTypeFull;
}
