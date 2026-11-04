import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { MediaType, Pair } from '../common/common.dto.js';
import {
  RequestsService,
  RequestWithSource,
} from '../requests/requests.service.js';
import { isNeeded } from '../requests/requests.utils.js';
import { getNextCleanup } from './cleanup.utils.js';
import {
  FulfilmentStatus,
  FulfilmentStatusDto,
  MediaFileDto,
  MovieStatusDto,
  SeriesStatusDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { fileEpisodes } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { ScanService } from './scan.service.js';

const READ = { disableIdentityMap: true };

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
    private readonly libraryService: LibraryService,
    private readonly scanService: ScanService,
  ) {}

  async describeTitleStatus({
    userId,
    mediaType,
    tmdbId,
  }: Pair): Promise<SeriesStatusDto> {
    const em = this.em.fork();
    const requests = await this.requestsService.findRequestsWithSources({
      userId,
      mediaType,
      tmdbId,
    });
    const files = await em.find(
      MediaFile,
      { mediaType, tmdbId },
      { ...READ, orderBy: { path: 'asc' } },
    );

    // The index of the title is brought in line with the disk soon
    await this.scanService.requestScan(mediaType, tmdbId);

    return {
      fulfilments: await this.describeFulfilments(em, requests),
      files: await this.describeFiles(em, files),
    };
  }

  /** The status of a title with the one request a user can have for a movie */
  async describeMovieStatus(
    userId: string,
    tmdbId: string,
  ): Promise<MovieStatusDto> {
    const {
      fulfilments: [fulfilment],
      files,
    } = await this.describeTitleStatus({
      userId,
      mediaType: MediaType.Movie,
      tmdbId,
    });

    return { fulfilment, files };
  }

  /** The requests that have a binding, and the active ones without one */
  private async describeFulfilments(
    em: EntityManager,
    requests: RequestWithSource[],
  ): Promise<FulfilmentStatusDto[]> {
    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));

    return requests.flatMap(
      (request) => describeFulfilment(request, bindingOf.get(request.id)) ?? [],
    );
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
}

/**
 * How the library fulfils a request, if it has anything to say of it: what
 * the binding of the request says, as a binding has a file, a torrent item
 * or an error, or that an active request bound to nothing is yet to be
 * looked at
 */
function describeFulfilment(
  request: RequestWithSource,
  binding: RequestBinding | undefined,
): FulfilmentStatusDto | undefined {
  const requestId = request.id;

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
      error: binding.error,
      errorMessage: binding.errorMessage,
    };
  }
  if (binding) {
    return { requestId, status: FulfilmentStatus.Downloading };
  }
  if (!request.source || !isNeeded(request)) return undefined;

  return { requestId, status: FulfilmentStatus.Pending };
}
