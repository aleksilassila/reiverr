import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import {
  EpisodeRefDto,
  MediaType,
  moviePair,
  seriesPair,
} from '../common/common.dto.js';
import {
  TorrentItemDto,
  TorrentItemStatus,
} from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { ResolvedSource, sourceOf } from '../requests/request-source.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { isNeeded } from '../requests/requests.utils.js';
import { getNextCleanup } from './cleanup.utils.js';
import {
  EpisodeStatusDto,
  MediaFileDto,
  MovieStatusDto,
  RequestStatus,
  RequestStatusDto,
  SeriesStatusDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { coversMedia, fileEpisodes } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { ScanService } from './scan.service.js';
import {
  expectedBytes,
  Gate,
  Room,
  roomFor,
  StorageService,
} from './storage.service.js';

const READ = { disableIdentityMap: true };

const episodeKey = (e: EpisodeRefDto) => `${e.season}-${e.episode}`;

/** What describes the request of a user for an episode or a movie */
interface RequestContext {
  request: MediaRequest | undefined;
  source: ResolvedSource | undefined;
  binding: RequestBinding | undefined;
  items: Map<string, TorrentItemDto>;
  /** The files of the title */
  filesById: Map<string, MediaFile>;
  /** The files of the episode or the movie */
  ofMedia: MediaFile[];
  gate: Gate;
  /** For an episode, how many episodes its season has, which a season's torrent is shared by */
  episodesInSeason: number | undefined;
}

/**
 * The status of a title for a user: the status of each of their requests,
 * from the rows the three modules wrote of them, and the files of the title. Nothing
 * of the engine is in it: the clients have the live state of the torrents
 * from downloads, and are told when a row changes.
 */
@Injectable()
export class StatusService {
  constructor(
    private readonly em: EntityManager,
    private readonly requestsService: RequestsService,
    private readonly downloadsService: DownloadsService,
    private readonly metadataService: MetadataService,
    private readonly libraryService: LibraryService,
    private readonly scanService: ScanService,
    private readonly storage: StorageService,
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
    const sources = await this.requestsService.findSources(
      seriesPair(userId, tmdbId),
    );
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
    const held = await this.heldOf(em, files);
    const items = await this.itemsOf(em, bindings);

    // The index of the series is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Series, tmdbId);
    const nextCleanup = await this.nextCleanup();
    const gate = await this.gateOf(em, userId);
    const episodeCounts = await this.metadataService.getEpisodeCounts(
      em,
      tmdbId,
    );

    const filesById = new Map(files.map((file) => [file.id, file]));
    const filesOf = ({ season, episode }: EpisodeRefDto) =>
      files.filter((file) =>
        coversMedia(file, {
          mediaType: MediaType.Series,
          tmdbId,
          season,
          episode,
        }),
      );

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

    return {
      episodes: episodes
        .map((episode): EpisodeStatusDto => {
          const request = requested.get(episodeKey(episode));
          const ofMedia = filesOf(episode);

          return {
            season: episode.season,
            episode: episode.episode,
            ...describeRequest({
              request,
              source:
                request && sourceOf(sources, request.season, request.episode),
              binding:
                request && bindings.find((b) => b.requestId === request.id),
              items,
              filesById,
              ofMedia,
              gate,
              episodesInSeason: episodeCounts.get(episode.season),
            }),
            onDisk: onDisk.has(episodeKey(episode)),
            cleanupAt: isCleanedUp(ofMedia, held) ? nextCleanup : undefined,
          };
        })
        .sort((a, b) => a.season - b.season || a.episode - b.episode),
      files: files.map(toMediaFileDto),
    };
  }

  async getMovieStatus(
    userId: string,
    tmdbId: string,
  ): Promise<MovieStatusDto> {
    const em = this.em.fork();
    const request = await this.requestsService.findMovieRequest(userId, tmdbId);
    const sources = await this.requestsService.findSources(
      moviePair(userId, tmdbId),
    );
    const files = await em.find(
      MediaFile,
      { mediaType: MediaType.Movie, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );
    const binding = request
      ? ((await em.findOne(RequestBinding, { requestId: request.id }, READ)) ??
        undefined)
      : undefined;
    const held = await this.heldOf(em, files);
    const items = await this.itemsOf(em, binding ? [binding] : []);

    // The index of the movie is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Movie, tmdbId);
    const nextCleanup = await this.nextCleanup();
    const gate = await this.gateOf(em, userId);

    return {
      ...describeRequest({
        request,
        source: sourceOf(sources, 0, 0),
        binding,
        items,
        filesById: new Map(files.map((file) => [file.id, file])),
        ofMedia: files,
        gate,
        episodesInSeason: undefined,
      }),
      onDisk: files.length > 0,
      cleanupAt: isCleanedUp(files, held) ? nextCleanup : undefined,
      files: files.map(toMediaFileDto),
    };
  }

  /** The files among the given ones that a request of anyone holds */
  private async heldOf(
    em: EntityManager,
    files: MediaFile[],
  ): Promise<Set<string>> {
    if (!files.length) return new Set();

    const bindings = await em.find(
      RequestBinding,
      { mediaFileId: { $in: files.map((file) => file.id) } },
      { ...READ, fields: ['mediaFileId'] },
    );

    return new Set(bindings.map((binding) => binding.mediaFileId));
  }

  /** The items the bindings wait for, by id */
  private async itemsOf(
    em: EntityManager,
    bindings: RequestBinding[],
  ): Promise<Map<string, TorrentItemDto>> {
    const items = await this.downloadsService.describeItems(
      em,
      bindings.flatMap((binding) => binding.torrentItemId ?? []),
    );

    return new Map(items.map((item) => [item.id, item]));
  }

  private async nextCleanup(): Promise<Date | undefined> {
    const { cleanup } = await this.libraryService.getSettings();

    return getNextCleanup(new Date(), cleanup);
  }

  /** What holds back a request of the user that is bound to nothing */
  private async gateOf(em: EntityManager, userId: string): Promise<Gate> {
    const diskFull = await this.storage.isDiskFull();

    return this.storage.gateOf(em, userId, { diskFull });
  }
}

/**
 * The status of the request of a user for an episode or a movie: what it is
 * bound to, whether what it is to get fits when it is bound to nothing,
 * and the torrent it downloads from or has its file from
 */
function describeRequest(
  context: RequestContext,
): Pick<RequestStatusDto, 'requested' | 'status' | 'error' | 'infoHash'> {
  const { request, source, binding, items, filesById } = context;
  const item = binding?.torrentItemId
    ? items.get(binding.torrentItemId)
    : undefined;
  const file = binding?.mediaFileId
    ? filesById.get(binding.mediaFileId)
    : undefined;
  const room =
    request && source && isNeeded(request) && !binding
      ? roomOf(source, context)
      : undefined;

  return {
    requested: !!request,
    ...(request && statusOf(request, source, binding, item, file, room)),
    infoHash: item?.infoHash ?? file?.infoHash,
  };
}

/** Whether a request that is bound to nothing can get what it is to get, as the fulfilment would find it */
function roomOf(
  source: ResolvedSource,
  { filesById, ofMedia, gate, episodesInSeason }: RequestContext,
): Room {
  if (source.kind === 'file') {
    return roomFor(gate, {
      bytes: filesById.get(source.mediaFileId)?.size ?? 0,
      download: false,
    });
  }
  const { infoHash, size } = source.release;
  const version = ofMedia.find((file) => file.infoHash === infoHash);
  if (version) return roomFor(gate, { bytes: version.size, download: false });

  return roomFor(gate, {
    bytes: expectedBytes(size, source.forEpisode, episodesInSeason),
    download: true,
  });
}

/**
 * The status of the request of a user and the error behind it, from what
 * the modules wrote of it. The room is what holds back a request that is
 * bound to nothing.
 */
function statusOf(
  request: MediaRequest,
  source: ResolvedSource | undefined,
  binding: RequestBinding | undefined,
  item: TorrentItemDto | undefined,
  file: MediaFile | undefined,
  room: Room | undefined,
): Pick<RequestStatusDto, 'status' | 'error'> {
  if (!request.approved) {
    return { status: RequestStatus.WaitingForApproval };
  }
  // A request that has its file has it, whatever its source is now
  if (file) return { status: RequestStatus.Available };
  if (!request.neededSince) {
    return {
      status: source ? RequestStatus.InactiveAhead : RequestStatus.NoPreference,
    };
  }
  if (!source) return { status: RequestStatus.NoPreference };
  if (binding?.error) {
    return { status: RequestStatus.Failed, error: binding.error };
  }
  if (!item) {
    if (room === 'over-quota') return { status: RequestStatus.OverQuota };
    if (room === 'disk-full') return { status: RequestStatus.DiskFull };

    return { status: RequestStatus.Resolving };
  }

  switch (item.status) {
    case TorrentItemStatus.Failed:
      return { status: RequestStatus.Failed, error: item.error };
    case TorrentItemStatus.NoMatch:
      return { status: RequestStatus.NoFileInTorrent, error: item.error };
    case TorrentItemStatus.Downloading:
    case TorrentItemStatus.Complete:
      return { status: RequestStatus.Downloading };
    default:
      return { status: RequestStatus.Resolving };
  }
}

/** No request of anyone keeps a file of the episode or the movie from the next cleanup */
const isCleanedUp = (ofMedia: MediaFile[], held: Set<string>) =>
  ofMedia.length > 0 &&
  ofMedia.every((file) => file.managed && !held.has(file.id));

const toMediaFileDto = (file: MediaFile): MediaFileDto => ({
  id: file.id,
  fileName: path.basename(file.path),
  size: file.size,
  managed: file.managed,
  infoHash: file.infoHash,
  season: file.season,
  episodes: fileEpisodes(file),
});
