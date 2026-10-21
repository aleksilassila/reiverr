import type { TorrentItem } from './torrent-item.entity.js';
import type { Torrent } from './torrent.entity.js';

export interface TorrentState {
  /** The items that are not released */
  wanted: Pick<TorrentItem, 'fileIndex' | 'completedAt'>[];
  /** Whether the file list of the torrent is known */
  hasFiles: boolean;
  torrent: Pick<Torrent, 'downloadedBytes' | 'uploadedBytes' | 'error'>;
  /** The torrent in the engine, when it runs */
  runtime?: { ready: boolean; error?: string; complete: Set<number> };
  /** Whether the torrent has data in the downloads folder */
  hasData: boolean;
  seedRatio: number;
}

export type TorrentDecision =
  /** Stop and delete the data: nothing is wanted and seeding is done */
  | { kind: 'release' }
  /** Stop and keep the data: nothing downloads, but an item waits for its import */
  | { kind: 'stop' }
  /** Stop, and keep the error until the torrent is picked or needed again */
  | { kind: 'fail'; error: string }
  /** Failed before: stays stopped */
  | { kind: 'failed' }
  | { kind: 'start' }
  /** Started, the engine says when it is ready */
  | { kind: 'wait' }
  /** Runs: downloads the files of the wanted items, of which some are complete */
  | { kind: 'run'; wanted: number[]; complete: number[] };

/** What a torrent does next */
export function decideTorrent(state: TorrentState): TorrentDecision {
  const { wanted, torrent, runtime } = state;

  if (runtime?.error) return { kind: 'fail', error: runtime.error };

  const files = [...new Set(wanted.flatMap((item) => item.fileIndex ?? []))];
  const downloads = wanted.some(
    (item) =>
      item.fileIndex !== null &&
      item.fileIndex !== undefined &&
      !item.completedAt,
  );
  const needsFiles =
    !state.hasFiles && wanted.some((item) => item.fileIndex == null);
  const isNeeded = downloads || needsFiles;
  // A failed torrent does not seed: its data goes once nothing wants it
  const seeds =
    !torrent.error &&
    state.hasData &&
    torrent.downloadedBytes > 0 &&
    torrent.uploadedBytes < state.seedRatio * torrent.downloadedBytes;

  if (!isNeeded && !seeds) {
    return wanted.length ? { kind: 'stop' } : { kind: 'release' };
  }
  if (!runtime && torrent.error) return { kind: 'failed' };
  if (!runtime) return { kind: 'start' };
  if (!runtime.ready) return { kind: 'wait' };

  return {
    kind: 'run',
    wanted: files,
    complete: files.filter((index) => runtime.complete.has(index)),
  };
}
