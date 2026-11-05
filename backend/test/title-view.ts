import {
  TorrentItemStatus,
  TorrentWithItemsDto,
} from '../src/downloads/downloads.dto.js';
import {
  FulfilmentStatus,
  FulfilmentStatusDto,
  MediaFileDto,
  MovieStatusDto,
  SeriesStatusDto,
} from '../src/library/library.dto.js';
import { FulfilmentError } from '../src/library/request-binding.entity.js';
import {
  MediaRequestDto,
  MovieRequestsDto,
  RequestSourceDto,
  SeriesRequestsDto,
} from '../src/requests/requests.dto.js';

/** An episode or a movie as a title page reads it from the requests, the status and the torrents of its title */
export interface MediaView {
  season: number;
  episode: number;
  requested: boolean;
  onDisk: boolean;
  status?: string;
  error?: string;
  infoHash?: string;
  cleanupAt?: Date | string;
}

const hasSource = (source: RequestSourceDto | undefined) =>
  !!source?.release || !!source?.mediaFileId;

function statusOf(
  request: MediaRequestDto | undefined,
  source: RequestSourceDto | undefined,
  fulfilment: FulfilmentStatusDto | undefined,
  torrentItemStatus: TorrentItemStatus | undefined,
): string | undefined {
  if (!request) return undefined;
  if (!request.approved) return 'waiting-for-approval';
  if (fulfilment?.status === FulfilmentStatus.Fulfilled) return 'fulfilled';
  if (request.ahead) return 'ahead';
  if (!hasSource(source)) return 'no-source';
  if (fulfilment?.status === FulfilmentStatus.Downloading) {
    if (torrentItemStatus === TorrentItemStatus.NoMatch) return 'no-match';
    if (torrentItemStatus === TorrentItemStatus.Failed) return 'failed';
  }
  if (
    fulfilment?.error === FulfilmentError.OverQuota ||
    fulfilment?.error === FulfilmentError.DiskFull
  ) {
    return fulfilment.error;
  }

  return fulfilment?.status;
}

function viewOf(
  season: number,
  episode: number,
  request: MediaRequestDto | undefined,
  source: RequestSourceDto | undefined,
  fulfilment: FulfilmentStatusDto | undefined,
  files: MediaFileDto[],
  torrents: TorrentWithItemsDto[],
): MediaView {
  const ofMedia = files.filter(
    (file) => file.season === season && file.episodes.includes(episode),
  );
  const file = files.find((file) => file.id === fulfilment?.mediaFileId);
  const infoHash = file?.infoHash ?? source?.release?.infoHash;
  const torrentItem =
    fulfilment?.status === FulfilmentStatus.Downloading
      ? torrents
          .find((torrent) => torrent.infoHash === infoHash)
          ?.torrentItems.find(
            (i) => i.season === season && i.episode === episode,
          )
      : undefined;

  return {
    season,
    episode,
    requested: !!request,
    onDisk: ofMedia.length > 0,
    status: statusOf(request, source, fulfilment, torrentItem?.status),
    error: fulfilment?.errorMessage ?? torrentItem?.error,
    infoHash,
    cleanupAt: ofMedia.every((file) => file.cleanupAt)
      ? ofMedia[0]?.cleanupAt
      : undefined,
  };
}

/** The episodes that the user requested or that are on disk, in season and episode order, and the files of the series */
export function seriesView(
  { requests, sources }: SeriesRequestsDto,
  { fulfilments, files }: SeriesStatusDto,
  torrents: TorrentWithItemsDto[],
): { episodes: MediaView[]; files: MediaFileDto[] } {
  const episodes = new Map<string, { season: number; episode: number }>();
  for (const { season, episode } of requests) {
    episodes.set(`${season}-${episode}`, { season, episode });
  }
  for (const { season, episodes: ofFile } of files) {
    for (const episode of ofFile) {
      episodes.set(`${season}-${episode}`, { season, episode });
    }
  }

  return {
    episodes: [...episodes.values()]
      .sort((a, b) => a.season - b.season || a.episode - b.episode)
      .map(({ season, episode }) => {
        const request = requests.find(
          (r) => r.season === season && r.episode === episode,
        );
        const sourceOf = (ofEpisode: number) =>
          sources.find((p) => p.season === season && p.episode === ofEpisode);

        return viewOf(
          season,
          episode,
          request,
          sourceOf(episode) ?? sourceOf(0),
          fulfilments.find((f) => f.requestId === request?.id),
          files,
          torrents,
        );
      }),
    files,
  };
}

/** The movie, and its files */
export function movieView(
  { request, source }: MovieRequestsDto,
  { fulfilment, files }: MovieStatusDto,
  torrents: TorrentWithItemsDto[],
): MediaView & { files: MediaFileDto[] } {
  return {
    ...viewOf(0, 0, request, source, fulfilment, files, torrents),
    files,
  };
}
