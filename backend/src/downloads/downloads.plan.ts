import { MediaType } from '../common/common.dto.js';
import type { MediaFile } from '../local-media/media-file.entity.js';
import type { MediaRequest } from '../requests/request.entity.js';
import { findEpisodeFile, findOnlyVideoFile } from './downloads.utils.js';
import type { TorrentSelection } from './torrent-selection.entity.js';
import type { Torrent } from './torrent.entity.js';

export interface DownloadsState {
  /** Episode requests */
  requests: Pick<
    MediaRequest,
    'id' | 'userId' | 'tmdbId' | 'season' | 'episode' | 'approved'
  >[];
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
    'tmdbId' | 'season' | 'episode' | 'lastEpisode' | 'infoHash'
  >[];
  seedRatio: number;
}

export enum PlannedStatus {
  WaitingForApproval = 'waiting-for-approval',
  NoSelection = 'no-selection',
  /** The file of the selected torrent is in the library */
  Available = 'available',
  /** The files of the selected torrent are not known yet */
  Resolving = 'resolving',
  NoFileInTorrent = 'no-file-in-torrent',
  Wanted = 'wanted',
}

export interface PlannedRequest {
  request: DownloadsState['requests'][number];
  status: PlannedStatus;
  torrentId?: string;
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
  selected: boolean;
}

export interface DownloadsPlan {
  requests: PlannedRequest[];
  torrents: PlannedTorrent[];
}

/**
 * What every request resolves to and what every torrent has to do for it.
 *
 * An approved request downloads from the torrent its user selected for the
 * episode, or else for the season. It is fulfilled by the file of that torrent
 * and by no other file of the episode.
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
        selected: state.selections.some((s) => s.torrentId === torrent.id),
      },
    ]),
  );
  const seriesSelections = state.selections.filter(
    (s) => s.mediaType === MediaType.Series,
  );

  const requests = state.requests.map((request): PlannedRequest => {
    if (!request.approved) {
      return { request, status: PlannedStatus.WaitingForApproval };
    }

    const ofSeason = seriesSelections.filter(
      (s) =>
        s.userId === request.userId &&
        s.tmdbId === request.tmdbId &&
        s.season === request.season,
    );
    const selection =
      ofSeason.find((s) => s.episode === request.episode) ??
      ofSeason.find((s) => s.episode === 0);
    if (!selection) return { request, status: PlannedStatus.NoSelection };

    const torrent = torrents.get(selection.torrentId);
    const torrentId = torrent.id;

    const isInLibrary = state.files.some(
      (file) =>
        file.infoHash === torrent.infoHash &&
        file.tmdbId === request.tmdbId &&
        file.season === request.season &&
        file.episode <= request.episode &&
        request.episode <= file.lastEpisode,
    );
    if (isInLibrary) {
      return { request, status: PlannedStatus.Available, torrentId };
    }

    if (!torrent.files) {
      planned.get(torrentId).needsFiles = true;
      return { request, status: PlannedStatus.Resolving, torrentId };
    }

    // The only video of an episode torrent is the episode, whatever it is called
    const file =
      findEpisodeFile(torrent.files, request.season, request.episode) ??
      (selection.episode !== 0 ? findOnlyVideoFile(torrent.files) : undefined);
    if (!file) {
      return { request, status: PlannedStatus.NoFileInTorrent, torrentId };
    }

    const { wanted } = planned.get(torrentId);
    const sameFile = wanted.find(
      (w) =>
        w.fileIndex === file.index &&
        w.tmdbId === request.tmdbId &&
        w.season === request.season,
    );
    if (!sameFile) {
      wanted.push({
        fileIndex: file.index,
        tmdbId: request.tmdbId,
        season: request.season,
        episodes: [request.episode],
      });
    } else if (!sameFile.episodes.includes(request.episode)) {
      sameFile.episodes.push(request.episode);
    }

    return {
      request,
      status: PlannedStatus.Wanted,
      torrentId,
      fileIndex: file.index,
    };
  });

  return { requests, torrents: [...planned.values()] };
}
