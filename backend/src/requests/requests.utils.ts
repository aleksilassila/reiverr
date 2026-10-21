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

export const seriesPair = (userId: string, tmdbId: string): Pair => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId,
});

export const groupBy = <T>(
  rows: T[],
  keyOf: (row: T) => string,
): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  return groups;
};
