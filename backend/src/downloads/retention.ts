import {
  Activity,
  fileOf,
  holdsFile,
  VersionFile,
} from '../requests/request-activity.js';
import type { MediaRequest } from '../requests/request.entity.js';

/** What decides which files of a title its requests have and hold */
export interface Holdings<F extends VersionFile> {
  requests: Pick<
    MediaRequest,
    'id' | 'tmdbId' | 'season' | 'episode' | 'torrentId' | 'mediaFileId'
  >[];
  activity: Map<string, Activity>;
  /** The info hash of every torrent that a request is bound to, by its id */
  infoHashes: Map<string, string>;
  files: F[];
}

const fileOfRequest = <F extends VersionFile>(
  holdings: Holdings<F>,
  request: Holdings<F>['requests'][number],
) =>
  fileOf(
    request,
    holdings.activity.get(request.id),
    holdings.infoHashes.get(request.torrentId),
    holdings.files,
  );

/** The ids of the files that an active or kept request holds */
export function heldFiles<F extends VersionFile>(
  holdings: Holdings<F>,
): Set<string> {
  return new Set(
    holdings.requests
      .filter((request) => holdsFile(holdings.activity.get(request.id)))
      .flatMap((request) => fileOfRequest(holdings, request)?.id ?? []),
  );
}

/** The requests whose file is one of the given ones, by request id */
export function requestsOfFiles<F extends VersionFile>(
  holdings: Holdings<F>,
  fileIds: Set<string>,
): Map<string, { torrentId?: string; fileId: string }> {
  const found = new Map<string, { torrentId?: string; fileId: string }>();
  for (const request of holdings.requests) {
    const file = fileOfRequest(holdings, request);
    if (file && fileIds.has(file.id)) {
      found.set(request.id, { torrentId: request.torrentId, fileId: file.id });
    }
  }

  return found;
}
