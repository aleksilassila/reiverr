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

export interface SeasonTorrent {
  season: number;
  release: ReleaseSnapshot;
}

export interface EpisodeTorrent {
  season: number;
  episode: number;
  release: ReleaseSnapshot;
}

export type Preferences = Pick<
  RequestRule,
  'seasonTorrents' | 'episodeTorrents'
>;

/** The torrent a user prefers for an episode: the episode's own, or else the season's */
export function preferenceOf(
  rule: Preferences | undefined,
  season: number,
  episode: number,
): ReleaseSnapshot | undefined {
  return (
    rule?.episodeTorrents?.find(
      (t) => t.season === season && t.episode === episode,
    )?.release ??
    rule?.seasonTorrents?.find((t) => t.season === season)?.release
  );
}

/** Whether a rule row has a preference for the episode itself */
export const hasEpisodePreference = (
  rule: Preferences | undefined,
  season: number,
  episode: number,
) =>
  !!rule?.episodeTorrents?.some(
    (t) => t.season === season && t.episode === episode,
  );
