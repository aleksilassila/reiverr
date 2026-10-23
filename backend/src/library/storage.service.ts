import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import { statfs } from 'node:fs/promises';
import {
  MediaType,
  MediaTypeFull,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { UsersService } from '../users/users.service.js';
import {
  DiskUsageDto,
  LibrarySettingsDto,
  StorageDto,
  StorageUsageDto,
  TitleUsageDto,
  TitleUsageSort,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';

const READ = { disableIdentityMap: true };

/** What the requests of a user take: the files they hold, and what the downloads they wait for are expected to take */
export interface Usage {
  heldBytes: number;
  pendingBytes: number;
}

/** What a request is to get: a file of the size, or a download expected to take as much */
export interface Candidate {
  bytes: number;
  download: boolean;
}

/** Whether a request can get what it is to get, and what holds it back when not */
export type Room = 'ok' | 'over-quota' | 'disk-full';

/** What a request of a user is gated by: what the other requests of the user take, the quota, and whether a disk is at the limit */
export interface Gate {
  usage: Usage;
  quota: number | null;
  diskFull: boolean;
}

const NO_USAGE: Usage = { heldBytes: 0, pendingBytes: 0 };

/**
 * Whether a request can get a candidate through its gate: when what the
 * other requests of its user take plus the candidate is within the quota,
 * and, for a download, while no disk is at the limit
 */
export function roomFor(gate: Gate, candidate: Candidate): Room {
  const { usage, quota, diskFull } = gate;
  if (
    quota !== null &&
    usage.heldBytes + usage.pendingBytes + candidate.bytes > quota
  ) {
    return 'over-quota';
  }
  if (candidate.download && diskFull) return 'disk-full';

  return 'ok';
}

/**
 * What the download of an episode from a release is expected to take: the
 * whole release for a torrent picked for the episode, its share of the
 * season for a season torrent, and the whole release again when the number
 * of episodes of the season is not known
 */
export function expectedBytes(
  releaseSize: number,
  forEpisode: boolean,
  episodesInSeason: number | undefined,
): number {
  return forEpisode || !episodesInSeason
    ? releaseSize
    : Math.ceil(releaseSize / episodesInSeason);
}

/** The files the bindings have, each once */
function filesOf(bindings: Pick<RequestBinding, 'mediaFileId'>[]): Set<string> {
  return new Set(bindings.flatMap((b) => b.mediaFileId ?? []));
}

/** What bindings take: every file once, and what the downloads are expected to take */
function usageOf(
  bindings: Pick<RequestBinding, 'pendingBytes' | 'mediaFileId'>[],
  sizeOf: Map<string, number>,
): Usage {
  return {
    heldBytes: [...filesOf(bindings)].reduce(
      (sum, id) => sum + (sizeOf.get(id) ?? 0),
      0,
    ),
    pendingBytes: bindings.reduce((sum, b) => sum + (b.pendingBytes ?? 0), 0),
  };
}

/**
 * The capacity side of the library: what the requests of users take, the
 * quotas of the users and the disk limit of the server. The fulfilment asks
 * before it gives a request a file or a download; nothing is taken back
 * for being over.
 */
@Injectable()
export class StorageService {
  constructor(
    private readonly em: EntityManager,
    private readonly requestsService: RequestsService,
    private readonly usersService: UsersService,
    private readonly libraryService: LibraryService,
    private readonly metadataService: MetadataService,
  ) {}

  /**
   * The gate of the requests of a user, in the caller's entity manager:
   * what their requests take, leaving out the binding of one request, and
   * the quota. The disk is the caller's to measure, outside its
   * transaction: the settings are read outside it, and the disk is not
   * what a transaction keeps consistent.
   */
  async gateOf(
    em: EntityManager,
    userId: string,
    options: { diskFull: boolean; except?: string },
  ): Promise<Gate> {
    const usages = await this.findUsages(em, {
      userId,
      except: options.except,
    });
    const quota = await this.usersService.getQuota(em, userId);

    return {
      usage: usages.get(userId) ?? NO_USAGE,
      quota,
      diskFull: options.diskFull,
    };
  }

  /**
   * What the requests of users take, by user id: of one user or of
   * everyone, leaving out the binding of one request. A file held by
   * several requests of a user counts once, one held by several users
   * counts for each.
   */
  private async findUsages(
    em: EntityManager,
    filter: { userId?: string; except?: string },
  ): Promise<Map<string, Usage>> {
    const requests = (
      await this.requestsService.findRequests(em, { userId: filter.userId })
    ).filter((request) => request.id !== filter.except);
    if (!requests.length) return new Map();

    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));
    const sizeOf = await this.findFileSizes(em, bindings);

    const byUser = new Map<string, RequestBinding[]>();
    for (const request of requests) {
      const binding = bindingOf.get(request.id);
      if (!binding) continue;
      byUser.set(request.userId, [
        ...(byUser.get(request.userId) ?? []),
        binding,
      ]);
    }

    return new Map(
      [...byUser].map(([userId, of]) => [userId, usageOf(of, sizeOf)]),
    );
  }

  private async findFileSizes(
    em: EntityManager,
    bindings: Pick<RequestBinding, 'mediaFileId'>[],
  ): Promise<Map<string, number>> {
    const ids = [...filesOf(bindings)];
    if (!ids.length) return new Map();

    const files = await em.find(
      MediaFile,
      { id: { $in: ids } },
      { ...READ, fields: ['id', 'size'] },
    );

    return new Map(files.map((file) => [file.id, file.size]));
  }

  /** Whether a disk is at the limit of the library settings */
  async isDiskFull(): Promise<boolean> {
    const settings = await this.libraryService.getSettings();
    const { maxDiskUsagePercent } = settings;
    if (maxDiskUsagePercent === null) return false;

    const disks = await this.measureDisks(settings);

    return disks.some((disk) => disk.usedPercent >= maxDiskUsagePercent);
  }

  /** The disks the files go to: the download directory and the library folders, as far as they can be measured */
  private async measureDisks(
    settings: LibrarySettingsDto,
  ): Promise<DiskUsageDto[]> {
    const paths = new Set([
      DOWNLOADS_DIR,
      ...settings.seriesFolders,
      ...settings.movieFolders,
    ]);

    const disks: DiskUsageDto[] = [];
    for (const path of paths) {
      // A path that cannot be measured, as one that is not there, is left out
      const stats = await statfs(path).catch(() => undefined);
      if (!stats) continue;

      // The percent is of what the server can use: the blocks reserved for root are left out
      const usedBytes = (stats.blocks - stats.bfree) * stats.bsize;
      const availableBytes = stats.bavail * stats.bsize;
      const usableBytes = usedBytes + availableBytes;
      disks.push({
        path,
        totalBytes: stats.blocks * stats.bsize,
        freeBytes: availableBytes,
        usedPercent: usableBytes > 0 ? (usedBytes / usableBytes) * 100 : 0,
      });
    }

    return disks;
  }

  /** The disks, the disk limit, and what the requests of every user take: for admins */
  async describe(): Promise<StorageDto> {
    const settings = await this.libraryService.getSettings();
    const em = this.em.fork();
    const users = await this.usersService.findQuotas(em);
    const usages = await this.findUsages(em, {});

    return {
      disks: await this.measureDisks(settings),
      maxDiskUsagePercent: settings.maxDiskUsagePercent,
      users: users.map((user) => ({
        userId: user.id,
        name: user.name,
        quotaBytes: user.quotaBytes,
        ...(usages.get(user.id) ?? NO_USAGE),
      })),
    };
  }

  /** The quota of a user and what their requests take */
  async describeUser(userId: string): Promise<StorageUsageDto> {
    const em = this.em.fork();
    const [user] = await this.usersService.findQuotas(em, { userId });
    if (!user) throw new NotFoundException('User not found');
    const usages = await this.findUsages(em, { userId });

    return {
      quotaBytes: user.quotaBytes,
      ...(usages.get(userId) ?? NO_USAGE),
    };
  }

  /**
   * The titles a user has requests for, with what the requests take and
   * the rule of the title: a page, of one type of title or both, by size,
   * by name or by when they last got a file, in the direction asked for
   * or the one natural to the sort. Counted as the usage of the user is,
   * so that the titles add up to it
   */
  async describeUserTitles(
    userId: string,
    options: {
      mediaType?: MediaType;
      sort: TitleUsageSort;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<TitleUsageDto>> {
    const em = this.em.fork();
    const requests = (
      await this.requestsService.findRequests(em, { userId })
    ).filter(
      (request) =>
        !options.mediaType || titleTypeOf(request) === options.mediaType,
    );
    const bindings = requests.length
      ? await em.find(
          RequestBinding,
          { requestId: { $in: requests.map((request) => request.id) } },
          READ,
        )
      : [];
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));
    const sizeOf = await this.findFileSizes(em, bindings);

    // A binding is written when it gets its file and left alone while it keeps it
    type Title = Omit<
      TitleUsageDto,
      'tmdbItem' | 'rule' | 'lastFulfilledAt'
    > & {
      lastFulfilledAt?: Date;
    };
    const titles = new Map<string, Title & { bindings: RequestBinding[] }>();
    for (const request of requests) {
      const mediaType = titleTypeOf(request);
      const key = titleKey(mediaType, request.tmdbId);
      const title = titles.get(key) ?? {
        mediaType,
        tmdbId: request.tmdbId,
        requests: 0,
        withFile: 0,
        downloading: 0,
        heldBytes: 0,
        pendingBytes: 0,
        bindings: [],
      };
      const binding = bindingOf.get(request.id);
      title.requests++;
      if (binding?.mediaFileId) {
        title.withFile++;
        if (
          !title.lastFulfilledAt ||
          binding.updatedAt > title.lastFulfilledAt
        ) {
          title.lastFulfilledAt = binding.updatedAt;
        }
      }
      if (binding?.torrentItemId) title.downloading++;
      if (binding) title.bindings.push(binding);
      titles.set(key, title);
    }
    const rows: Title[] = [...titles.values()].map(
      ({ bindings, ...title }) => ({
        ...title,
        ...usageOf(bindings, sizeOf),
      }),
    );
    const takes = (row: Title) => row.heldBytes + row.pendingBytes;
    // The sort's own order, reversed when the other direction is asked for
    const reversed =
      !!options.direction && options.direction !== NATURAL[options.sort];
    const sign = reversed ? -1 : 1;

    if (options.sort === TitleUsageSort.Fulfilled) {
      const hasFile = (row: Title) => (row.lastFulfilledAt ? 1 : 0);
      const fulfilledAt = (row: Title) => row.lastFulfilledAt?.getTime() ?? 0;
      // Titles without a file go last either way
      rows.sort(
        (a, b) =>
          hasFile(b) - hasFile(a) ||
          sign * (fulfilledAt(b) - fulfilledAt(a)) ||
          takes(b) - takes(a) ||
          a.tmdbId.localeCompare(b.tmdbId),
      );
    } else if (options.sort === TitleUsageSort.Name) {
      const names = new Map<string, string>();
      for (const mediaType of [MediaType.Movie, MediaType.Series]) {
        const ofType = rows.filter((row) => row.mediaType === mediaType);
        const found = await this.metadataService.findNames(
          em,
          mediaType,
          ofType.map((row) => row.tmdbId),
        );
        for (const [tmdbId, name] of found) {
          names.set(titleKey(mediaType, tmdbId), name);
        }
      }
      const nameOf = (row: Title) =>
        names.get(titleKey(row.mediaType, row.tmdbId)) ?? '';
      rows.sort(
        (a, b) =>
          sign * nameOf(a).localeCompare(nameOf(b)) ||
          a.tmdbId.localeCompare(b.tmdbId),
      );
    } else {
      rows.sort(
        (a, b) =>
          sign * (takes(b) - takes(a)) || a.tmdbId.localeCompare(b.tmdbId),
      );
    }

    const { page, itemsPerPage } = options.pagination;
    const ofPage = rows.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const rules = new Map(
      (await this.requestsService.findRules(em, { userId })).map((rule) => [
        titleKey(rule.mediaType, rule.tmdbId),
        rule,
      ]),
    );
    const items: TitleUsageDto[] = [];
    for (const { lastFulfilledAt, ...row } of ofPage) {
      const rule = rules.get(titleKey(row.mediaType, row.tmdbId));
      items.push({
        ...row,
        tmdbItem: await this.metadataService.getTmdbItem(
          row.tmdbId,
          row.mediaType,
        ),
        ...(lastFulfilledAt && {
          lastFulfilledAt: lastFulfilledAt.toISOString(),
        }),
        ...(rule && {
          rule: {
            keepNext: rule.keepNext,
            keepWatched: rule.keepWatched,
            keepWatchedHours: rule.keepWatchedHours,
          },
        }),
      });
    }

    return { items, total: rows.length, page, itemsPerPage };
  }
}

/** The direction each sort of the titles reads in when none is asked for */
const NATURAL: Record<TitleUsageSort, OrderDirection> = {
  [TitleUsageSort.Size]: OrderDirection.Desc,
  [TitleUsageSort.Name]: OrderDirection.Asc,
  [TitleUsageSort.Fulfilled]: OrderDirection.Desc,
};

/** The title of a request: a movie, or the series of an episode */
function titleTypeOf(request: { mediaType: MediaTypeFull }): MediaType {
  return request.mediaType === MediaTypeFull.Movie
    ? MediaType.Movie
    : MediaType.Series;
}

function titleKey(mediaType: MediaType, tmdbId: string): string {
  return `${mediaType}:${tmdbId}`;
}
