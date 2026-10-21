import { MediaType } from '../common/common.dto.js';

type Title = { mediaType: MediaType; tmdbId: string };

/**
 * Every job type with its payload. A type names the module that runs it and
 * what it does, like a method of that module. The payload names the resource
 * a job acts on and nothing else, and the dedupe key is the type and the
 * whole payload, so a job that is merged into a queued one loses nothing.
 *
 * The jobs table is also how a module tells another one what happened, in
 * the transaction of the change: requests enqueues `library.reconcileRequest`
 * for every request whose inputs changed, and downloads enqueues
 * `library.importItem` for every item of a torrent that is complete.
 */
export interface JobPayloads {
  'downloads.reconcileTorrent': { infoHash: string };
  'library.reconcileRequest': { requestId: string };
  'library.importItem': { infoHash: string; itemId: string };
  'library.scanTitle': Title;
  'library.scanFolder': { folder: string };
  'library.cleanUpLibrary': Record<string, never>;
  'library.cleanUpTitle': Title;
}

export type JobType = keyof JobPayloads;

export interface JobKeys {
  /** Only one job per key is queued, an enqueue with the key merges into it */
  dedupe: string;
  /** Only one job per key runs at a time */
  lock: string;
}

/** What can run together with what: the lock key is the resource a job acts on */
export const JOB_KEYS: {
  [T in JobType]: (payload: JobPayloads[T]) => JobKeys;
} = {
  'downloads.reconcileTorrent': ({ infoHash }) => ({
    dedupe: `downloads.reconcileTorrent:${infoHash}`,
    lock: `torrent:${infoHash}`,
  }),
  'library.reconcileRequest': ({ requestId }) => ({
    dedupe: `library.reconcileRequest:${requestId}`,
    lock: `request:${requestId}`,
  }),
  // An import never overlaps a start, stop or release of its torrent
  'library.importItem': ({ infoHash, itemId }) => ({
    dedupe: `library.importItem:${itemId}`,
    lock: `torrent:${infoHash}`,
  }),
  'library.scanTitle': ({ mediaType, tmdbId }) => ({
    dedupe: `library.scanTitle:${mediaType}:${tmdbId}`,
    lock: `title:${mediaType}:${tmdbId}`,
  }),
  'library.scanFolder': ({ folder }) => ({
    dedupe: `library.scanFolder:${folder}`,
    lock: `folder:${folder}`,
  }),
  'library.cleanUpLibrary': () => ({
    dedupe: 'library.cleanUpLibrary',
    lock: 'library',
  }),
  'library.cleanUpTitle': ({ mediaType, tmdbId }) => ({
    dedupe: `library.cleanUpTitle:${mediaType}:${tmdbId}`,
    lock: `title:${mediaType}:${tmdbId}`,
  }),
};
