import { MediaTypeFull } from '../common/common.dto.js';

export const MEDIA_REQUESTS_CHANGED = 'media-requests.changed';

export interface MediaRequestsChangedEvent {
  tmdbId: string;
  mediaType: MediaTypeFull;
}
