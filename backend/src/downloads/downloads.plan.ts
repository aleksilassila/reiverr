import { MediaType } from '../common/common.dto.js';
import type { MediaFile } from '../local-media/media-file.entity.js';
import {
  ActivityState,
  evaluateActivity,
} from '../requests/request-activity.js';
import type { MediaRequest } from '../requests/request.entity.js';
import type { TorrentSelection } from '../requests/torrent-selection.entity.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import type { Torrent } from './torrent.entity.js';

export interface DownloadsState {
  /** Episode requests, with the torrent and the file they refer to so far */
  requests: Pick<
    MediaRequest,
    | 'id'
    | 'userId'
    | 'tmdbId'
    | 'season'
    | 'episode'
    | 'approved'
    | 'torrentId'
    | 'mediaFileId'
  >[];
  /** The torrents that users prefer for their requests */
  selections: Pick<
    TorrentSelection,
    'userId' | 'mediaType' | 'tmdbId' | 'season' | 'episode' | 'torrentId'
  >[];
  torrents: Pick<
    Torrent,
    'id' | 'infoHash' | 'files' | 'downloadedBytes' | 'uploadedBytes'
  >[];
  /** Episode files in the library */
  files: Pick<
    MediaFile,
    | 'id'
    | 'tmdbId'
    | 'season'
    | 'episode'
    | 'lastEpisode'
    | 'infoHash'
    | 'managed'
  >[];
  rules: ActivityState['rules'];
  playStates: ActivityState['playStates'];
  /** Milliseconds since the epoch */
  now: number;
  seedRatio: number;
}

type PlanRequest = DownloadsState['requests'][number];

export enum PlannedStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** A rule holds the request back until the user has watched up to it */
  InactiveAhead = 'inactive-ahead',
  /** A rule does not keep the request of the watched episode, or has no file of it to keep */
  InactiveWatched = 'inactive-watched',
  /** The request is bound to no torrent and its user prefers none for it */
  NoSelection = 'no-selection',
  /** The file of the torrent of the request is in the library */
  Available = 'available',
  /** The files of the torrent of the request are not known yet */
  Resolving = 'resolving',
  NoFileInTorrent = 'no-file-in-torrent',
  Wanted = 'wanted',
}

export interface PlannedRequest {
  request: PlanRequest;
  status: PlannedStatus;
  /** The torrent the request is to refer to */
  torrentId?: string;
  /** The file the request is to refer to */
  mediaFileId?: string;
  fileIndex?: number;
}

export interface WantedFile {
  fileIndex: number;
  tmdbId: string;
  season: number;
  /** The requested episodes that this file is downloaded for */
  episodes: number[];
}

export interface PlannedTorrent {
  torrentId: string;
  wanted: WantedFile[];
  /** A request waits for the file list of the torrent */
  needsFiles: boolean;
  seeds: boolean;
  /** A selection or a request refers to the torrent */
  referenced: boolean;
}

export interface DownloadsPlan {
  requests: PlannedRequest[];
  torrents: PlannedTorrent[];
  /** The managed files that no request holds, which a cleanup deletes */
  unretained: DownloadsState['files'];
}

const keyOf = (...parts: (string | number)[]) => parts.join('/');

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(getKey(item));
    if (group) group.push(item);
    else groups.set(getKey(item), [item]);
  }

  return groups;
}

/**
 * What every request refers to and what every torrent has to do for it.
 *
 * A request is bound to its torrent when it is made or its user's preference
 * changes (RequestsService.bind). It downloads from that torrent, whatever the
 * user selects later. It is fulfilled by the file of that torrent and by no
 * other file of the episode, and refers to the file from then on. The caller
 * stores the file.
 *
 * A request that a rule makes inactive downloads nothing and gets no file.
 * One that a rule keeps downloads nothing either (see evaluateActivity): it
 * only gets a file of its torrent that is there.
 *
 * A request holds the file that fulfils it. Nothing else retains a file: not
 * an inactive request, and not a request that is bound to another torrent.
 */
export function planDownloads(state: DownloadsState): DownloadsPlan {
  const torrents = new Map(state.torrents.map((t) => [t.id, t]));
  const planned = new Map(
    state.torrents.map((torrent): [string, PlannedTorrent] => [
      torrent.id,
      {
        torrentId: torrent.id,
        wanted: [],
        needsFiles: false,
        seeds:
          torrent.downloadedBytes > 0 &&
          torrent.uploadedBytes < state.seedRatio * torrent.downloadedBytes,
        referenced: false,
      },
    ]),
  );
  const selections = new Map(
    state.selections
      .filter((s) => s.mediaType === MediaType.Series)
      .map((s) => [keyOf(s.userId, s.tmdbId, s.season, s.episode), s]),
  );

  const filesById = new Map(state.files.map((file) => [file.id, file]));
  // The library files of a season by the torrent they were imported from
  const versions = groupBy(
    state.files.filter((file) => file.infoHash),
    (file) => keyOf(file.infoHash, file.tmdbId, file.season),
  );
  const activity = evaluateActivity(state);
  const retained = new Set<DownloadsState['files'][number]>();

  const planRequest = (request: PlanRequest): PlannedRequest => {
    const stored = {
      request,
      torrentId: request.torrentId ?? undefined,
      mediaFileId: request.mediaFileId ?? undefined,
    };

    const status = activity.get(request.id);
    if (status === 'waiting') {
      return { ...stored, status: PlannedStatus.WaitingForApproval };
    }
    if (status === 'ahead') {
      return { ...stored, status: PlannedStatus.InactiveAhead };
    }
    if (status === 'watched') {
      return { ...stored, status: PlannedStatus.InactiveWatched };
    }

    const { userId, tmdbId, season, episode } = request;
    const ofEpisode = selections.get(keyOf(userId, tmdbId, season, episode));
    const torrentId = stored.torrentId;
    const torrent = torrents.get(torrentId);
    const inLibrary =
      filesById.get(stored.mediaFileId) ??
      (torrent &&
        versions
          .get(keyOf(torrent.infoHash, tmdbId, season))
          ?.find(
            (file) => file.episode <= episode && episode <= file.lastEpisode,
          ));

    // A kept request holds on to the file it has, it downloads none
    if (status === 'kept' && !inLibrary) {
      return { ...stored, status: PlannedStatus.InactiveWatched };
    }
    if (!torrent) return { ...stored, status: PlannedStatus.NoSelection };

    if (inLibrary) {
      retained.add(inLibrary);

      return {
        request,
        status: PlannedStatus.Available,
        torrentId,
        mediaFileId: inLibrary.id,
      };
    }

    if (!torrent.files) {
      planned.get(torrentId).needsFiles = true;
      return { request, status: PlannedStatus.Resolving, torrentId };
    }

    // The only video of a torrent that is selected for the episode is the
    // episode, whatever it is called
    const file =
      findEpisodeFile(torrent.files, season, episode) ??
      (ofEpisode?.torrentId === torrentId
        ? findOnlyVideoFile(torrent.files)
        : undefined);
    if (!file) {
      return { request, status: PlannedStatus.NoFileInTorrent, torrentId };
    }

    const { wanted } = planned.get(torrentId);
    const sameFile = wanted.find(
      (w) =>
        w.fileIndex === file.index &&
        w.tmdbId === tmdbId &&
        w.season === season,
    );
    if (!sameFile) {
      wanted.push({
        fileIndex: file.index,
        tmdbId,
        season,
        episodes: [episode],
      });
    } else if (!sameFile.episodes.includes(episode)) {
      sameFile.episodes.push(episode);
    }

    return {
      request,
      status: PlannedStatus.Wanted,
      torrentId,
      fileIndex: file.index,
    };
  };

  const requests = state.requests.map(planRequest);
  for (const { torrentId } of [...state.selections, ...requests]) {
    if (planned.has(torrentId)) planned.get(torrentId).referenced = true;
  }

  return {
    requests,
    torrents: [...planned.values()],
    unretained: state.files.filter(
      (file) => file.managed && !retained.has(file),
    ),
  };
}
