import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { MediaType } from '../common/common.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { TorrentItem } from '../downloads/torrent-item.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { ResolvedSource } from '../requests/request-source.js';
import { MediaRequest } from '../requests/request.entity.js';
import {
  RequestsService,
  RequestWithSource,
} from '../requests/requests.service.js';
import { isNeeded, mediaOf } from '../requests/requests.utils.js';
import { getNextCleanup } from './cleanup.utils.js';
import {
  FulfilmentStatus,
  FulfilmentStatusDto,
  MediaFileDto,
  MovieStatusDto,
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

/** The status of an active request that is bound to nothing, by whether what it is to get fits */
const STATUS_OF_ROOM: Record<Room, FulfilmentStatus> = {
  ok: FulfilmentStatus.Pending,
  'over-quota': FulfilmentStatus.OverQuota,
  'disk-full': FulfilmentStatus.DiskFull,
};

/**
 * How the library fulfils the requests of a user for a title, and the files
 * of the title, by the rows the library wrote. Whether a request is
 * approved, ahead or has a source, the requests of the title say; what the
 * engine is doing, the torrents of the title. The clients combine the three,
 * and are told when a row changes.
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
    const requests = await this.requestsService.findRequestsWithSources({
      userId,
      mediaType: MediaType.Series,
      tmdbId,
    });
    const files = await this.findFiles(em, MediaType.Series, tmdbId);
    const episodeCounts = await this.metadataService.getEpisodeCounts(
      em,
      tmdbId,
    );

    // The index of the series is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Series, tmdbId);

    return {
      fulfilments: await this.describeFulfilments(em, userId, requests, {
        files,
        episodeCounts,
      }),
      files: await this.describeFiles(em, files),
    };
  }

  async getMovieStatus(
    userId: string,
    tmdbId: string,
  ): Promise<MovieStatusDto> {
    const em = this.em.fork();
    const requests = await this.requestsService.findRequestsWithSources({
      userId,
      mediaType: MediaType.Movie,
      tmdbId,
    });
    const files = await this.findFiles(em, MediaType.Movie, tmdbId);

    // The index of the movie is brought in line with the disk soon
    await this.scanService.requestScan(MediaType.Movie, tmdbId);

    const [fulfilment] = await this.describeFulfilments(em, userId, requests, {
      files,
    });

    return {
      fulfilment,
      files: await this.describeFiles(em, files),
    };
  }

  private findFiles(
    em: EntityManager,
    mediaType: MediaType,
    tmdbId: string,
  ): Promise<MediaFile[]> {
    return em.find(
      MediaFile,
      { mediaType, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );
  }

  /** The requests that have a binding, and the active ones without one */
  private async describeFulfilments(
    em: EntityManager,
    userId: string,
    requests: RequestWithSource[],
    context: Pick<FulfilmentContext, 'files' | 'episodeCounts'>,
  ): Promise<FulfilmentStatusDto[]> {
    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const items = await this.downloadsService.findItems(
      em,
      bindings.flatMap((binding) => binding.torrentItemId ?? []),
    );
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));
    const itemOf = new Map(items.map((item) => [item.id, item]));
    const gate = await this.gateOf(em, userId);

    return requests.flatMap((request) => {
      const binding = bindingOf.get(request.id);

      return (
        describeFulfilment(request, binding, {
          ...context,
          gate,
          item: itemOf.get(binding?.torrentItemId),
        }) ?? []
      );
    });
  }

  /** The files of a title, with when the next cleanup deletes the managed ones no request of anyone holds */
  private async describeFiles(
    em: EntityManager,
    files: MediaFile[],
  ): Promise<MediaFileDto[]> {
    const bindings = await em.find(
      RequestBinding,
      { mediaFileId: { $in: files.map((file) => file.id) } },
      { ...READ, fields: ['mediaFileId'] },
    );
    const held = new Set(bindings.map((binding) => binding.mediaFileId));
    const { cleanup } = await this.libraryService.getSettings();
    const nextCleanup = getNextCleanup(new Date(), cleanup);

    return files.map((file) => ({
      id: file.id,
      fileName: path.basename(file.path),
      size: file.size,
      managed: file.managed,
      infoHash: file.infoHash,
      season: file.season,
      episodes: fileEpisodes(file),
      cleanupAt: file.managed && !held.has(file.id) ? nextCleanup : undefined,
    }));
  }

  /** What holds back a request of the user that is bound to nothing */
  private async gateOf(em: EntityManager, userId: string): Promise<Gate> {
    const diskFull = await this.storage.isDiskFull();

    return this.storage.gateOf(em, userId, { diskFull });
  }
}

/** What the fulfilment of a request is read from, beside its binding */
interface FulfilmentContext {
  files: MediaFile[];
  /** For a series, how many episodes its seasons have, which a season's torrent is shared by */
  episodeCounts?: Map<number, number>;
  gate: Gate;
  /** The torrent item of the binding */
  item: TorrentItem | undefined;
}

/**
 * How the library fulfils a request, if it has anything to say of it: what
 * the binding of the request says, as a binding has a file, a torrent item
 * or an error, or for an active request bound to nothing whether what it is
 * to get fits
 */
function describeFulfilment(
  request: RequestWithSource,
  binding: RequestBinding | undefined,
  context: FulfilmentContext,
): FulfilmentStatusDto | undefined {
  const requestId = request.id;
  const infoHash = context.item?.torrentHash;

  if (binding?.mediaFileId) {
    return {
      requestId,
      status: FulfilmentStatus.Fulfilled,
      mediaFileId: binding.mediaFileId,
    };
  }
  if (binding?.error) {
    return {
      requestId,
      status: FulfilmentStatus.Failed,
      infoHash,
      error: binding.error,
    };
  }
  if (binding) {
    return { requestId, status: FulfilmentStatus.Downloading, infoHash };
  }

  const { source } = request;
  if (!source || !isNeeded(request)) return undefined;

  return {
    requestId,
    status: STATUS_OF_ROOM[roomOf(request, source, context)],
  };
}

/** Whether a request that is bound to nothing can get what it is to get, as the fulfilment would find it */
function roomOf(
  request: MediaRequest,
  source: ResolvedSource,
  { files, gate, episodeCounts }: FulfilmentContext,
): Room {
  if (source.kind === 'file') {
    const file = files.find((file) => file.id === source.mediaFileId);

    return roomFor(gate, { bytes: file?.size ?? 0, download: false });
  }
  const { infoHash, size } = source.release;
  const version = files.find(
    (file) => file.infoHash === infoHash && coversMedia(file, mediaOf(request)),
  );
  if (version) return roomFor(gate, { bytes: version.size, download: false });

  return roomFor(gate, {
    bytes: expectedBytes(
      size,
      source.forEpisode,
      episodeCounts?.get(request.season),
    ),
    download: true,
  });
}
