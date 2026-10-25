import type { RequestRule } from './request-rule.entity.js';

/** The torrent a user prefers for every episode of a season */
export interface SeasonTorrent {
  season: number;
  infoHash: string;
}

/**
 * What a user prefers for an episode, over the season's torrent: a torrent,
 * or a file in the library. The preference for a movie is the entry with
 * season and episode 0 on the rule of the movie.
 */
export type EpisodeSource = { season: number; episode: number } & (
  { kind: 'torrent'; infoHash: string } | { kind: 'file'; mediaFileId: string }
);

/**
 * Where the request of a user for an episode or a movie gets its file: the
 * torrent the user prefers, or a file in the library
 */
export type RequestSource =
  | {
      kind: 'torrent';
      infoHash: string;
      /**
       * The torrent was picked for this episode alone, or for the movie, so
       * its only video is the episode, whatever the file is called
       */
      forEpisode: boolean;
    }
  | { kind: 'file'; mediaFileId: string };

export type Preferences = Pick<
  RequestRule,
  'seasonTorrents' | 'episodeSources'
>;

/** The source of an episode: the episode's own preference, else the season's torrent. A movie is episode 0 of season 0. */
export function sourceOf(
  rule: Preferences | undefined,
  season: number,
  episode: number,
): RequestSource | undefined {
  const own = rule?.episodeSources?.find(
    (source) => source.season === season && source.episode === episode,
  );
  if (own?.kind === 'file') {
    return { kind: 'file', mediaFileId: own.mediaFileId };
  }
  if (own) return { kind: 'torrent', infoHash: own.infoHash, forEpisode: true };

  const pack = rule?.seasonTorrents?.find((t) => t.season === season);

  return pack
    ? { kind: 'torrent', infoHash: pack.infoHash, forEpisode: false }
    : undefined;
}
