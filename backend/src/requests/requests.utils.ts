import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import type { MediaRequest } from './request.entity.js';

/** A user and a title, whose requests a rule looks at together */
export interface Pair {
  userId: string;
  mediaType: MediaType;
  tmdbId: string;
}

/** The title a request is for, as the rules and files know it */
export const titleTypeOf = (mediaType: MediaTypeFull): MediaType =>
  mediaType === MediaTypeFull.Movie ? MediaType.Movie : MediaType.Series;

/** The play states of a title, as the requests for it are typed */
export const fullTypeOf = (mediaType: MediaType): MediaTypeFull =>
  mediaType === MediaType.Movie ? MediaTypeFull.Movie : MediaTypeFull.Episode;

export const pairKey = ({ userId, mediaType, tmdbId }: Pair) =>
  `${userId}/${mediaType}/${tmdbId}`;

/** Whether a request is approved and wanted by the rules of its user, its source aside */
export const isNeeded = (
  request: Pick<MediaRequest, 'approved' | 'neededSince'>,
): boolean => request.approved && !!request.neededSince;

export const uniquePairs = (pairs: Pair[]): Pair[] => [
  ...new Map(
    pairs.map(({ userId, mediaType, tmdbId }) => [
      pairKey({ userId, mediaType, tmdbId }),
      { userId, mediaType, tmdbId },
    ]),
  ).values(),
];

export const pairOf = (
  request: Pick<MediaRequest, 'userId' | 'mediaType' | 'tmdbId'>,
): Pair => ({
  userId: request.userId,
  mediaType: titleTypeOf(request.mediaType),
  tmdbId: request.tmdbId,
});

/** The movie or the episode a request is for, as the files of the library are keyed */
export const mediaOf = (
  request: Pick<MediaRequest, 'mediaType' | 'tmdbId' | 'season' | 'episode'>,
): {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
} => ({
  mediaType: titleTypeOf(request.mediaType),
  tmdbId: request.tmdbId,
  season: request.season,
  episode: request.episode,
});

export const seriesPair = (userId: string, tmdbId: string): Pair => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId,
});

export const moviePair = (userId: string, tmdbId: string): Pair => ({
  userId,
  mediaType: MediaType.Movie,
  tmdbId,
});
