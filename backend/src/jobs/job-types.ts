import { MediaType } from '../common/common.dto.js';

/**
 * Every job type with its payload. The payload names the resource a job acts
 * on and nothing else, so a job that is merged into a queued one with the same
 * dedupe key loses nothing.
 */
export interface JobPayloads {
  'torrent.reconcile': { torrentId: string };
  'torrent.import': { torrentId: string; fileIndex: number };
  'title.cleanup': { mediaType: MediaType; tmdbId: string };
  'library.cleanup': Record<string, never>;
  'title.sync': { mediaType: MediaType; tmdbId: string };
  'library.scan': { folder: string };
}

export type JobType = keyof JobPayloads;

export interface JobKeys {
  /** Only one job per key is queued, an enqueue with the key merges into it */
  dedupe: string;
  /** Only one job per key runs at a time */
  lock: string;
}

const same = (key: string): JobKeys => ({ dedupe: key, lock: key });

/** What can run together with what */
export const JOB_KEYS: {
  [T in JobType]: (payload: JobPayloads[T]) => JobKeys;
} = {
  'torrent.reconcile': ({ torrentId }) => same(`torrent:${torrentId}`),
  // An import never overlaps a start, stop or discard of its torrent
  'torrent.import': ({ torrentId, fileIndex }) => ({
    dedupe: `import:${torrentId}:${fileIndex}`,
    lock: `torrent:${torrentId}`,
  }),
  'title.cleanup': ({ mediaType, tmdbId }) => ({
    dedupe: `cleanup:${mediaType}:${tmdbId}`,
    lock: `media:${mediaType}:${tmdbId}`,
  }),
  'library.cleanup': () => same('cleanup'),
  'title.sync': ({ mediaType, tmdbId }) => ({
    dedupe: `sync:${mediaType}:${tmdbId}`,
    lock: `media:${mediaType}:${tmdbId}`,
  }),
  'library.scan': ({ folder }) => same(`scan:${folder}`),
};
