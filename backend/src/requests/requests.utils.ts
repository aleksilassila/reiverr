import { Pair } from '../common/common.dto.js';
import type { MediaRequest } from './request.entity.js';

/** Whether a request is approved and wanted by the rules of its user, its source aside */
export const isNeeded = (
  request: Pick<MediaRequest, 'approved' | 'neededSince'>,
): boolean => request.approved && !!request.neededSince;

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
