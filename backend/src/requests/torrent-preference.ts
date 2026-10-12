import type { RequestRule } from './request-rule.entity.js';

/**
 * What a user picked from a search, kept so that it can be resolved again
 * long after the search result has expired
 */
export interface ReleaseSnapshot {
  /** The search result the user picked, to show which one it was */
  releaseId: string;
  indexer: string;
  title: string;
  /** Bytes */
  size: number;
  infoHash?: string;
  magnetUrl?: string;
  /** Carries the indexer's API key, so it never leaves the server */
  downloadUrl?: string;
}

/** What a user picked from the library, kept so that it can be named after the file is gone */
export interface FileSnapshot {
  mediaFileId: string;
  fileName: string;
  /** Bytes */
  size: number;
}

/** How the requests of an episode are bound: a torrent to download from, or a file in the library */
export type Source =
  | { kind: 'torrent'; release: ReleaseSnapshot }
  | { kind: 'file'; file: FileSnapshot };

export interface SeasonTorrent {
  season: number;
  release: ReleaseSnapshot;
}

export type EpisodeSource = { season: number; episode: number } & Source;

export type Preferences = Pick<
  RequestRule,
  'seasonTorrents' | 'episodeSources'
>;

/** What a user prefers for an episode: the episode's own source, or else the season's torrent */
export function preferenceOf(
  rule: Preferences | undefined,
  season: number,
  episode: number,
): Source | undefined {
  const own = rule?.episodeSources?.find(
    (s) => s.season === season && s.episode === episode,
  );
  if (own) return own;

  const pack = rule?.seasonTorrents?.find((t) => t.season === season);

  return pack && { kind: 'torrent', release: pack.release };
}

/** The torrent a user prefers for an episode, when what they prefer is a torrent */
export function preferredRelease(
  rule: Preferences | undefined,
  season: number,
  episode: number,
): ReleaseSnapshot | undefined {
  const source = preferenceOf(rule, season, episode);

  return source?.kind === 'torrent' ? source.release : undefined;
}

/** Whether a rule row has a preference for the episode itself */
export const hasEpisodePreference = (
  rule: Preferences | undefined,
  season: number,
  episode: number,
) =>
  !!rule?.episodeSources?.some(
    (s) => s.season === season && s.episode === episode,
  );
