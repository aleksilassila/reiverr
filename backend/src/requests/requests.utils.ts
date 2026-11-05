import type { EntityManager } from '@mikro-orm/sqlite';
import { randomUUID } from 'node:crypto';
import { MediaType, Pair } from '../common/common.dto.js';
import { RequestSource } from './request-source.entity.js';
import type { MediaRequest } from './request.entity.js';

/** A release as a user picked it, resolved: what downloads needs to get the torrent */
interface SelectedRelease {
  infoHash: string;
  title: string;
  indexer: string;
  size: number;
  magnetUrl?: string;
  torrentFile?: Buffer;
}

/**
 * Where the request of a user for an episode or a movie gets its file: the
 * release the user picked, or a file in the library
 */
export type ResolvedSource =
  | {
      kind: 'torrent';
      release: SelectedRelease;
      /**
       * The torrent was picked for this episode alone, or for the movie, so
       * its only video is the episode, whatever the file is called
       */
      forEpisode: boolean;
    }
  | { kind: 'file'; mediaFileId: string };

/** What a source row gives the requests of its target: nothing while a torrent source has no release */
export function resolvedOf(source: RequestSource): ResolvedSource | undefined {
  if (source.kind === 'file') {
    return source.mediaFileId == null
      ? undefined
      : { kind: 'file', mediaFileId: source.mediaFileId };
  }

  const { infoHash, title, indexer, size, magnetUrl, torrentFile } = source;
  if (infoHash == null || title == null || indexer == null || size == null) {
    return undefined;
  }

  return {
    kind: 'torrent',
    release: {
      infoHash,
      title,
      indexer,
      size,
      magnetUrl: magnetUrl ?? undefined,
      torrentFile: torrentFile ?? undefined,
    },
    forEpisode: source.mediaType === MediaType.Movie || source.episode !== 0,
  };
}

/** The source of an episode among the sources of its title: the episode's own, else its season's (episode 0). A movie is episode 0 of season 0. */
export function sourceOf(
  sources: RequestSource[],
  season: number,
  episode: number,
): ResolvedSource | undefined {
  const source =
    sources.find((s) => s.season === season && s.episode === episode) ??
    sources.find((s) => s.season === season && s.episode === 0);

  return source && resolvedOf(source);
}

/** Makes a source what the requests of its target get their files from, in place of the one they had */
export async function writeSource(
  tx: EntityManager,
  source: Omit<RequestSource, 'id' | 'createdAt'>,
): Promise<void> {
  const { userId, mediaType, tmdbId, season, episode } = source;
  await tx.nativeDelete(RequestSource, {
    userId,
    mediaType,
    tmdbId,
    season,
    episode,
  });
  await tx.insert(RequestSource, {
    ...source,
    id: randomUUID(),
    createdAt: new Date(),
  });
}

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
