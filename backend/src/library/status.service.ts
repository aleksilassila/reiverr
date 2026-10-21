import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { EpisodeRefDto, MediaType } from '../common/common.dto.js';
import { getNextCleanup } from '../downloads/cleanup.utils.js';
import {
  TorrentDto,
  TorrentItemDto,
  TorrentItemStatus,
  TorrentStatus,
  TorrentWithItemsDto,
} from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { RequestSource, sourceOf } from '../requests/request-source.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { SelectedRelease } from '../requests/selected-release.entity.js';
import {
  EpisodeDownloadStatus,
  EpisodeStatusDto,
  PreferenceDto,
  PreferredFileDto,
  SeriesStatusDto,
} from './library.dto.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import * as path from 'node:path';

const READ = { disableIdentityMap: true };

// How soon a series that is looked at is scanned
const SCAN_DELAY = 30_000;

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

/** Where the request of a user stands, as the request page shows it */
type Standing = Pick<EpisodeStatusDto, 'status' | 'progress' | 'error'>;

/** The series status: where the requests and the preferred sources of a user stand */
@Injectable()
export class StatusService {
  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly requestsService: RequestsService,
    private readonly downloadsService: DownloadsService,
  ) {}

  async getSeriesStatus(
    userId: string,
    tmdbId: string,
  ): Promise<SeriesStatusDto> {
    const em = this.em.fork();
    const requests = await this.requestsService.findSeriesRequests(
      userId,
      tmdbId,
    );
    const rule = await this.requestsService.findSeriesRule(userId, tmdbId);
    const files = await em.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );
    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const held = new Set(
      files.length
        ? (
            await em.find(
              RequestBinding,
              { mediaFileId: { $in: files.map((file) => file.id) } },
              { ...READ, fields: ['mediaFileId'] },
            )
          ).map((binding) => binding.mediaFileId)
        : [],
    );
    const items = new Map(
      (
        await this.downloadsService.describeItems(
          em,
          bindings.flatMap((binding) => binding.torrentItemId ?? []),
        )
      ).map((item) => [item.id, item]),
    );

    const preferred = [
      ...(rule?.seasonTorrents ?? []).map((t) => t.infoHash),
      ...(rule?.episodeSources ?? []).flatMap((s) =>
        s.kind === 'torrent' ? [s.infoHash] : [],
      ),
    ];
    const hashes = [
      ...new Set([
        ...preferred,
        ...[...items.values()].map((item) => item.infoHash),
        ...files.flatMap((file) => file.infoHash ?? []),
      ]),
    ];
    const torrents = new Map(
      (await this.downloadsService.describeTorrents(hashes)).map((torrent) => [
        torrent.infoHash,
        torrent,
      ]),
    );
    const releases = new Map(
      (
        await em.find(
          SelectedRelease,
          {
            infoHash: { $in: preferred.filter((hash) => !torrents.has(hash)) },
          },
          READ,
        )
      ).map((release) => [release.infoHash, release]),
    );

    // The index of the series is brought in line with the disk soon
    await this.jobs.enqueue(
      em,
      'library.scanTitle',
      { mediaType: MediaType.Series, tmdbId },
      { runAt: new Date(Date.now() + SCAN_DELAY) },
    );
    const { cleanup } = await this.downloadsService.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    const torrentOf = (
      infoHash: string | undefined,
    ): TorrentDto | undefined => {
      if (!infoHash) return undefined;
      const torrent = torrents.get(infoHash);
      if (torrent) return toTorrentDto(torrent);
      const release = releases.get(infoHash);

      return release && idleTorrent(release);
    };
    const filesById = new Map(files.map((file) => [file.id, file]));
    const filesOf = (e: EpisodeRefDto) =>
      files.filter(
        (file) =>
          file.season === e.season &&
          file.episode <= e.episode &&
          e.episode <= file.lastEpisode,
      );
    const isCleanedUp = (e: EpisodeRefDto) => {
      const ofEpisode = filesOf(e);

      return (
        ofEpisode.length > 0 &&
        ofEpisode.every((file) => file.managed && !held.has(file.id))
      );
    };

    const onDisk = new Map<string, EpisodeRefDto>();
    for (const file of files) {
      for (let episode = file.episode; episode <= file.lastEpisode; episode++) {
        const ref = { season: file.season, episode };
        onDisk.set(episodeKey(ref), ref);
      }
    }
    const requested = new Map(
      requests.map((request) => [episodeKey(request), request]),
    );
    const episodes = [
      ...requested.values(),
      ...[...onDisk.values()].filter((e) => !requested.has(episodeKey(e))),
    ];

    const preferences: PreferenceDto[] = [
      ...(rule?.seasonTorrents ?? []).map((t) => ({
        season: t.season,
        episode: 0,
        torrent: torrentOf(t.infoHash),
      })),
      ...(rule?.episodeSources ?? []).map(({ season, episode, ...source }) => ({
        season,
        episode,
        ...(source.kind === 'torrent'
          ? { torrent: torrentOf(source.infoHash) }
          : {
              file: describeFile(
                source.mediaFileId,
                filesById.get(source.mediaFileId),
              ),
            }),
      })),
    ];

    return {
      preferences: preferences.sort(
        (a, b) => a.season - b.season || a.episode - b.episode,
      ),
      episodes: episodes
        .map((episode): EpisodeStatusDto => {
          const request = requested.get(episodeKey(episode));
          const binding =
            request && bindings.find((b) => b.requestId === request.id);
          const item = binding?.torrentItemId
            ? items.get(binding.torrentItemId)
            : undefined;
          const file = binding?.mediaFileId
            ? filesById.get(binding.mediaFileId)
            : undefined;
          const source =
            request && sourceOf(rule, request.season, request.episode);
          const torrent = torrentOf(item?.infoHash ?? file?.infoHash);

          return {
            season: episode.season,
            episode: episode.episode,
            requested: !!request,
            onDisk: onDisk.has(episodeKey(episode)),
            ...(request && standingOf(request, source, binding, item, file)),
            torrent,
            cleanupAt: isCleanedUp(episode) ? nextCleanup : undefined,
          };
        })
        .sort((a, b) => a.season - b.season || a.episode - b.episode),
      onServer: [
        ...new Set([
          ...[...torrents.values()]
            .filter((torrent) => isOnServer(torrent))
            .map((torrent) => torrent.infoHash),
          ...files.flatMap((file) => file.infoHash ?? []),
        ]),
      ],
    };
  }
}

/** Where the request of a user stands, from what the modules say of it */
function standingOf(
  request: MediaRequest,
  source: RequestSource | undefined,
  binding: RequestBinding | undefined,
  item: TorrentItemDto | undefined,
  file: MediaFile | undefined,
): Standing {
  if (!request.approved) {
    return { status: EpisodeDownloadStatus.WaitingForApproval };
  }
  // A request that has its file has it, whatever its source is now
  if (file) return { status: EpisodeDownloadStatus.Available };
  if (!request.neededSince) {
    return {
      status: source
        ? EpisodeDownloadStatus.InactiveAhead
        : EpisodeDownloadStatus.NoPreference,
    };
  }
  if (!source) return { status: EpisodeDownloadStatus.NoPreference };
  if (binding?.error) {
    return { status: EpisodeDownloadStatus.Failed, error: binding.error };
  }
  if (!item) return { status: EpisodeDownloadStatus.Resolving };

  switch (item.status) {
    case TorrentItemStatus.Failed:
      return { status: EpisodeDownloadStatus.Failed, error: item.error };
    case TorrentItemStatus.NoMatch:
      return {
        status: EpisodeDownloadStatus.NoFileInTorrent,
        error: item.error,
      };
    case TorrentItemStatus.Downloading:
      return {
        status: EpisodeDownloadStatus.Downloading,
        progress: item.progress,
      };
    case TorrentItemStatus.Complete:
      return { status: EpisodeDownloadStatus.Downloading, progress: 1 };
    default:
      return { status: EpisodeDownloadStatus.Resolving };
  }
}

/** A torrent that has data on the server, or that something is wanted of */
const isOnServer = (torrent: TorrentWithItemsDto) =>
  torrent.downloadedBytes > 0 ||
  torrent.items.some((item) => item.status !== TorrentItemStatus.Released);

const toTorrentDto = ({ items, ...torrent }: TorrentWithItemsDto): TorrentDto =>
  torrent;

/** A preferred torrent that downloads knows nothing of yet: the release as it was picked */
const idleTorrent = (release: SelectedRelease): TorrentDto => ({
  infoHash: release.infoHash,
  title: release.title,
  indexer: release.indexer,
  size: release.size,
  downloadedBytes: 0,
  uploadedBytes: 0,
  status: TorrentStatus.Idle,
  peers: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
});

/** A preferred file: as it is in the library, or only its id when it is gone */
const describeFile = (
  mediaFileId: string,
  file: MediaFile | undefined,
): PreferredFileDto => ({
  id: mediaFileId,
  inLibrary: !!file,
  fileName: file && path.basename(file.path),
  size: file?.size,
  managed: file?.managed,
});
