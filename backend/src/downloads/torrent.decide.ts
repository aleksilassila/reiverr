import type { MediaRequest } from '../requests/request.entity.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import type { Torrent } from './torrent.entity.js';

export interface WantedFile {
  fileIndex: number;
  tmdbId: string;
  season: number;
  /** The requested episodes that this file is downloaded for */
  episodes: number[];
}

/** What a request bound to a torrent has or waits for */
export type RequestDemand =
  | { kind: 'file' }
  | { kind: 'wanted'; fileIndex: number }
  | { kind: 'resolving' }
  | { kind: 'no-file-in-torrent' }
  /** It is not active: it waits, a rule holds it back, or it only keeps a file */
  | { kind: 'none' };

export interface DemandState {
  torrent: Pick<Torrent, 'id' | 'infoHash' | 'files'>;
  /** The episode requests that are bound to the torrent */
  requests: Pick<
    MediaRequest,
    | 'id'
    | 'userId'
    | 'tmdbId'
    | 'season'
    | 'episode'
    | 'activity'
    | 'mediaFileId'
  >[];
  /** The episodes whose user prefers this torrent for the episode itself, for the only-video rule */
  episodePreferences: {
    userId: string;
    tmdbId: string;
    season: number;
    episode: number;
  }[];
}

export interface Demand {
  wanted: WantedFile[];
  /** A request waits for the file list of the torrent */
  needsFiles: boolean;
  requests: Map<string, RequestDemand>;
}

/**
 * What the requests that are bound to a torrent want from it. An active
 * request without a file wants the file of its episode: the one named after
 * it, or the only video of a torrent that its user picked for the episode.
 */
export function torrentDemand(state: DemandState): Demand {
  const { torrent } = state;
  const demand: Demand = { wanted: [], needsFiles: false, requests: new Map() };

  for (const request of state.requests) {
    const set = (result: RequestDemand) =>
      demand.requests.set(request.id, result);

    if (request.mediaFileId) {
      set({ kind: 'file' });
      continue;
    }
    if (request.activity !== 'active') {
      set({ kind: 'none' });
      continue;
    }
    if (!torrent.files) {
      demand.needsFiles = true;
      set({ kind: 'resolving' });
      continue;
    }

    const { userId, tmdbId, season, episode } = request;
    const isPreferredForEpisode = state.episodePreferences.some(
      (p) =>
        p.userId === userId &&
        p.tmdbId === tmdbId &&
        p.season === season &&
        p.episode === episode,
    );
    const wanted =
      findEpisodeFile(torrent.files, season, episode) ??
      (isPreferredForEpisode ? findOnlyVideoFile(torrent.files) : undefined);
    if (!wanted) {
      set({ kind: 'no-file-in-torrent' });
      continue;
    }

    const same = demand.wanted.find(
      (w) =>
        w.fileIndex === wanted.index &&
        w.tmdbId === tmdbId &&
        w.season === season,
    );
    if (!same) {
      demand.wanted.push({
        fileIndex: wanted.index,
        tmdbId,
        season,
        episodes: [episode],
      });
    } else if (!same.episodes.includes(episode)) {
      same.episodes.push(episode);
    }
    set({ kind: 'wanted', fileIndex: wanted.index });
  }

  return demand;
}

export type TorrentDecision =
  /** Stop, delete the data, and forget the row if nothing refers to it */
  | { kind: 'release' }
  /** Stop, and run again at retryAt */
  | { kind: 'fail'; error: string; retryAt: Date }
  /** Stays stopped until retryAt */
  | { kind: 'backoff'; retryAt: Date }
  | { kind: 'start' }
  /** Started, the engine says when it is ready */
  | { kind: 'wait' }
  | { kind: 'run'; wanted: number[]; imports: number[] };

export interface TorrentState {
  demand: Pick<Demand, 'wanted' | 'needsFiles'>;
  torrent: Pick<
    Torrent,
    'downloadedBytes' | 'uploadedBytes' | 'attempts' | 'retryAt'
  >;
  /** The torrent in the engine, when it runs */
  runtime?: { ready: boolean; error?: string; complete: Set<number> };
  /** Whether the torrent has data in the downloads folder */
  hasData: boolean;
  seedRatio: number;
  now: Date;
}

const MINUTE = 60 * 1000;

/** The delay before something that failed its nth time is tried again */
export const retryDelay = (attempts: number) =>
  Math.min(5 * MINUTE * 2 ** Math.max(attempts - 1, 0), 6 * 60 * MINUTE);

/** What a torrent does next */
export function decideTorrent(state: TorrentState): TorrentDecision {
  const { demand, torrent, runtime, now } = state;

  if (runtime?.error) {
    const attempts = torrent.attempts + 1;

    return {
      kind: 'fail',
      error: runtime.error,
      retryAt: new Date(now.getTime() + retryDelay(attempts)),
    };
  }

  const isNeeded = demand.wanted.length > 0 || demand.needsFiles;
  const seeds =
    state.hasData &&
    torrent.downloadedBytes > 0 &&
    torrent.uploadedBytes < state.seedRatio * torrent.downloadedBytes;
  if (!isNeeded && !seeds) return { kind: 'release' };

  if (!runtime && torrent.retryAt && torrent.retryAt > now) {
    return { kind: 'backoff', retryAt: torrent.retryAt };
  }
  if (!runtime) return { kind: 'start' };
  if (!runtime.ready) return { kind: 'wait' };

  const wanted = [...new Set(demand.wanted.map((w) => w.fileIndex))];

  return {
    kind: 'run',
    wanted,
    imports: wanted.filter((index) => runtime.complete.has(index)),
  };
}
