import { MediaType } from '../common/common.dto.js';

type Title = { mediaType: MediaType; tmdbId: string };

/**
 * Every job type with its payload. A type names the module that runs it and
 * what it does, like a method of that module. The payload names the resource
 * a job acts on and nothing else, and the dedupe key is the type and the
 * whole payload, so a job that is merged into a queued one loses nothing.
 */
export interface JobPayloads {
  'downloads.reconcileTitle': Title;
  'downloads.reconcileTorrent': { torrentId: string };
  'localMedia.importTorrentFile': { torrentId: string; fileIndex: number };
  'localMedia.scanTitle': Title;
  'localMedia.scanFolder': { folder: string };
  'localMedia.cleanUpTitle': Title;
  'localMedia.cleanUpLibrary': Record<string, never>;
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
  // The jobs of a title never overlap: binding, scanning and cleaning it up
  'downloads.reconcileTitle': ({ mediaType, tmdbId }) => ({
    dedupe: `downloads.reconcileTitle:${mediaType}:${tmdbId}`,
    lock: `title:${mediaType}:${tmdbId}`,
  }),
  'downloads.reconcileTorrent': ({ torrentId }) => ({
    dedupe: `downloads.reconcileTorrent:${torrentId}`,
    lock: `torrent:${torrentId}`,
  }),
  // An import never overlaps a start, stop or release of its torrent
  'localMedia.importTorrentFile': ({ torrentId, fileIndex }) => ({
    dedupe: `localMedia.importTorrentFile:${torrentId}:${fileIndex}`,
    lock: `torrent:${torrentId}`,
  }),
  'localMedia.scanTitle': ({ mediaType, tmdbId }) => ({
    dedupe: `localMedia.scanTitle:${mediaType}:${tmdbId}`,
    lock: `title:${mediaType}:${tmdbId}`,
  }),
  'localMedia.scanFolder': ({ folder }) => ({
    dedupe: `localMedia.scanFolder:${folder}`,
    lock: `folder:${folder}`,
  }),
  'localMedia.cleanUpTitle': ({ mediaType, tmdbId }) => ({
    dedupe: `localMedia.cleanUpTitle:${mediaType}:${tmdbId}`,
    lock: `title:${mediaType}:${tmdbId}`,
  }),
  'localMedia.cleanUpLibrary': () => ({
    dedupe: 'localMedia.cleanUpLibrary',
    lock: 'library',
  }),
};
