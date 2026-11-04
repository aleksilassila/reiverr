import { MediaType } from '../common/common.dto.js';
import type { RequestSource } from './request-source.entity.js';

/** A release as a user picked it, resolved: what downloads needs to get the torrent */
export interface SelectedRelease {
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
