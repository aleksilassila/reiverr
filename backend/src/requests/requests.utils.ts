import { Pair } from '../common/common.dto.js';
import type { RequestSource } from './request-source.entity.js';
import { sourceOf } from './request-source.js';
import type { MediaRequest } from './request.entity.js';

/** Whether a request is approved and wanted by the rules of its user, its source aside */
export const isNeeded = (
  request: Pick<MediaRequest, 'approved' | 'neededSince'>,
): boolean => request.approved && !!request.neededSince;

/**
 * Whether the download-ahead window of the rule of its user holds a request
 * back: an approved request with a source is needed unless the window keeps
 * it out, and it stays needed. The sources are those of its pair.
 */
export const isAhead = (
  request: Pick<
    MediaRequest,
    'approved' | 'neededSince' | 'season' | 'episode'
  >,
  sources: RequestSource[],
): boolean =>
  request.approved &&
  !request.neededSince &&
  !!sourceOf(sources, request.season, request.episode);

export const pairOf = ({
  userId,
  mediaType,
  tmdbId,
}: Pick<MediaRequest, 'userId' | 'mediaType' | 'tmdbId'>): Pair => ({
  userId,
  mediaType,
  tmdbId,
});

/** The movie or the episode a request is for, as the files of the library are keyed */
export const mediaOf = ({
  mediaType,
  tmdbId,
  season,
  episode,
}: Pick<MediaRequest, 'mediaType' | 'tmdbId' | 'season' | 'episode'>) => ({
  mediaType,
  tmdbId,
  season,
  episode,
});
