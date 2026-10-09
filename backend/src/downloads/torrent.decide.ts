import {
  Activity,
  fileOf,
  holdsFile,
  VersionFile,
} from '../requests/request-activity.js';
import type { MediaRequest } from '../requests/request.entity.js';
import type { TorrentSelection } from '../requests/torrent-selection.entity.js';
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
  | { kind: 'file'; mediaFileId: string }
  | { kind: 'wanted'; fileIndex: number }
  | { kind: 'resolving' }
  | { kind: 'no-file-in-torrent' }
  /** It waits, a rule holds it back, or it is kept without a file */
  | { kind: 'none' };

export interface DemandState {
  torrent: Pick<Torrent, 'id' | 'infoHash' | 'files'>;
  /** The episode requests that are bound to the torrent */
  requests: Pick<
    MediaRequest,
    'id' | 'userId' | 'tmdbId' | 'season' | 'episode' | 'mediaFileId'
  >[];
  /** The activity of the requests, evaluated for their whole series */
  activity: Map<string, Activity>;
  /** Library files of the requested series */
  files: VersionFile[];
  /** Selections of the users of the requests, for the only-video rule */
  selections: Pick<
    TorrentSelection,
    'userId' | 'tmdbId' | 'season' | 'episode' | 'torrentId'
  >[];
}

export interface Demand {
  /** Files to store for holding requests that have them in the library */
  attach: { requestId: string; mediaFileId: string }[];
  wanted: WantedFile[];
  /** A request waits for the file list of the torrent */
  needsFiles: boolean;
  requests: Map<string, RequestDemand>;
}

/**
 * What the requests that are bound to a torrent want from it. A request that
 * holds its file (active or kept) has the file of the torrent that covers its
 * episode once it is in the library. An active request without one wants the
 * file of its episode: the one named after it, or the only video of a torrent
 * that its user selected for the episode.
 */
export function torrentDemand(state: DemandState): Demand {
  const { torrent } = state;
  const demand: Demand = {
    attach: [],
    wanted: [],
    needsFiles: false,
    requests: new Map(),
  };

  for (const request of state.requests) {
    const activity = state.activity.get(request.id);
    const set = (result: RequestDemand) =>
      demand.requests.set(request.id, result);

    if (!holdsFile(activity)) {
      set({ kind: 'none' });
      continue;
    }

    const file = fileOf(request, activity, torrent.infoHash, state.files);
    if (request.mediaFileId || file) {
      if (!request.mediaFileId) {
        demand.attach.push({ requestId: request.id, mediaFileId: file.id });
      }
      set({ kind: 'file', mediaFileId: request.mediaFileId ?? file.id });
      continue;
    }
    // A kept request holds on to a file it has, it downloads none
    if (activity === 'kept') {
      set({ kind: 'none' });
      continue;
    }

    if (!torrent.files) {
      demand.needsFiles = true;
      set({ kind: 'resolving' });
      continue;
    }

    const { userId, tmdbId, season, episode } = request;
    const isSelectedForEpisode = state.selections.some(
      (s) =>
        s.userId === userId &&
        s.tmdbId === tmdbId &&
        s.season === season &&
        s.episode === episode &&
        s.torrentId === torrent.id,
    );
    const wanted =
      findEpisodeFile(torrent.files, season, episode) ??
      (isSelectedForEpisode ? findOnlyVideoFile(torrent.files) : undefined);
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

/** The delay before a torrent that failed its nth time is started again */
export const torrentRetryDelay = (attempts: number) =>
  Math.min(5 * MINUTE * 2 ** Math.max(attempts - 1, 0), 6 * 60 * MINUTE);

/** What a torrent does next */
export function decideTorrent(state: TorrentState): TorrentDecision {
  const { demand, torrent, runtime, now } = state;

  if (runtime?.error) {
    const attempts = torrent.attempts + 1;

    return {
      kind: 'fail',
      error: runtime.error,
      retryAt: new Date(now.getTime() + torrentRetryDelay(attempts)),
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
