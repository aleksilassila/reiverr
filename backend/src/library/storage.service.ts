import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  initialOf,
  Letter,
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { DOWNLOADS_DIR } from '../consts.js';
import { measureDisk } from './disk.utils.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { titleTypeOf } from '../requests/requests.utils.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { readLibrarySettings } from './library-settings.js';
import {
  DiskUsageDto,
  LibrarySettingsDto,
  StorageDto,
  StorageUsageDto,
  TitleUsageDto,
  TitleUsageSort,
  TitleUsageStatus,
} from './library.dto.js';
import { libraryFolderPaths } from './library.utils.js';
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
  fileOf: Map<string, Pick<MediaFile, 'size'>>,
): Usage {
  return {
    heldBytes: [...filesOf(bindings)].reduce(
      (sum, id) => sum + (fileOf.get(id)?.size ?? 0),
      0,
    ),
    pendingBytes: bindings.reduce((sum, b) => sum + (b.pendingBytes ?? 0), 0),
  };
}

/** A title with files in the library: how many, how many of them the cleanup deletes, what they take, and when the newest was indexed */
interface TitleOnDisk {
  mediaType: MediaType;
  tmdbId: string;
  files: number;
  unretained: number;
  diskBytes: number;
  addedAt: number;
}

/** What a user has of a title: their requests, those with their file, what the files take (as their usage counts it) and when the newest held file was indexed */
interface TitleHeld {
  requests: number;
  fulfilled: number;
  heldBytes: number;
  addedAt: number;
}

const NOTHING_HELD: TitleHeld = {
  requests: 0,
  fulfilled: 0,
  heldBytes: 0,
  addedAt: 0,
};

/** A listed title, with what it is sorted by: the user's figures with the requested status, the title's without */
type TitleRow = Omit<TitleUsageDto, 'tmdbItem' | 'rule'> & {
  bytes: number;
  addedAt: number;
};

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
    private readonly settingsService: SettingsService,
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
    const fileOf = await this.findHeldFiles(em, bindings);

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
      [...byUser].map(([userId, of]) => [userId, usageOf(of, fileOf)]),
    );
  }

  /** The files the bindings hold, by id: their size, and when they were indexed */
  private async findHeldFiles(
    em: EntityManager,
    bindings: Pick<RequestBinding, 'mediaFileId'>[],
  ): Promise<Map<string, Pick<MediaFile, 'size' | 'createdAt'>>> {
    const ids = [...filesOf(bindings)];
    if (!ids.length) return new Map();

    const files = await em.find(
      MediaFile,
      { id: { $in: ids } },
      { ...READ, fields: ['id', 'size', 'createdAt'] },
    );

    return new Map(files.map((file) => [file.id, file]));
  }

  /** Whether a disk is at the limit of the library settings */
  async isDiskFull(): Promise<boolean> {
    const settings = await readLibrarySettings(this.settingsService);
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
      ...libraryFolderPaths(settings.seriesFolders),
      ...libraryFolderPaths(settings.movieFolders),
    ]);

    const disks: DiskUsageDto[] = [];
    for (const path of paths) {
      // A path that cannot be measured, as one that is not there, is left out
      const disk = await measureDisk(path);
      if (disk) disks.push(disk);
    }

    return disks;
  }

  /** The disks, the disk limit, and what the requests of every user take: for admins */
  async describe(): Promise<StorageDto> {
    const settings = await readLibrarySettings(this.settingsService);
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
   * The titles that have files in the library, with what the files take
   * and what the requests of a user hold of them: a page, of one type of
   * title or both, every title or those a request of the user has a file
   * of, under a letter or all, by size, by name or by when the newest file
   * was indexed, in the direction asked for or the one natural to the sort.
   * With the requested status the size and the date are of the files the
   * user's requests hold, counted as the usage of the user is, so that the
   * titles add up to what it holds; without it, of every file of the title
   */
  async describeUserTitles(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: TitleUsageStatus;
      letter?: Letter;
      sort: TitleUsageSort;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<TitleUsageDto>> {
    const em = this.em.fork();
    const requested = options.status === TitleUsageStatus.Requested;
    const onDisk = await this.findTitlesOnDisk(em, options.mediaType);
    const held = await this.findHeldTitles(em, userId, options.mediaType);

    const rows: TitleRow[] = [];
    for (const title of onDisk) {
      const of =
        held.get(titleKey(title.mediaType, title.tmdbId)) ?? NOTHING_HELD;
      if (requested && !of.fulfilled) continue;
      rows.push({
        mediaType: title.mediaType,
        tmdbId: title.tmdbId,
        files: title.files,
        unretained: title.unretained,
        diskBytes: title.diskBytes,
        requests: of.requests,
        fulfilled: of.fulfilled,
        heldBytes: of.heldBytes,
        bytes: requested ? of.heldBytes : title.diskBytes,
        addedAt: requested ? of.addedAt : title.addedAt,
      });
    }

    // The cached names, for the letter and the name sort; without one a title is '': first by name, under '#'
    const names = new Map<string, string>();
    if (options.letter || options.sort === TitleUsageSort.Name) {
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
    }
    const nameOf = (row: TitleRow) =>
      names.get(titleKey(row.mediaType, row.tmdbId)) ?? '';
    const listed = options.letter
      ? rows.filter((row) => initialOf(nameOf(row)) === options.letter)
      : rows;
    // The sort's own order, reversed when the other direction is asked for
    const reversed =
      !!options.direction && options.direction !== NATURAL[options.sort];
    const sign = reversed ? -1 : 1;
    const byId = (a: TitleRow, b: TitleRow) =>
      a.tmdbId.localeCompare(b.tmdbId) ||
      a.mediaType.localeCompare(b.mediaType);

    if (options.sort === TitleUsageSort.Added) {
      listed.sort((a, b) => sign * (b.addedAt - a.addedAt) || byId(a, b));
    } else if (options.sort === TitleUsageSort.Name) {
      listed.sort(
        (a, b) => sign * nameOf(a).localeCompare(nameOf(b)) || byId(a, b),
      );
    } else {
      listed.sort((a, b) => sign * (b.bytes - a.bytes) || byId(a, b));
    }

    const { page, itemsPerPage } = options.pagination;
    const ofPage = listed.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const rules = new Map(
      (await this.requestsService.findRules(em, { userId })).map((rule) => [
        titleKey(rule.mediaType, rule.tmdbId),
        rule,
      ]),
    );
    const items: TitleUsageDto[] = [];
    for (const row of ofPage) {
      const rule = rules.get(titleKey(row.mediaType, row.tmdbId));
      items.push({
        mediaType: row.mediaType,
        tmdbId: row.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          row.tmdbId,
          row.mediaType,
        ),
        files: row.files,
        unretained: row.unretained,
        diskBytes: row.diskBytes,
        requests: row.requests,
        fulfilled: row.fulfilled,
        heldBytes: row.heldBytes,
        ...(rule && {
          rule: {
            keepNext: rule.keepNext,
            keepWatched: rule.keepWatched,
            keepWatchedHours: rule.keepWatchedHours,
          },
        }),
      });
    }

    return { items, total: listed.length, page, itemsPerPage };
  }

  /**
   * Every title with files, of one type or both: how many, how many of
   * them are managed and held by no request of anyone (what the cleanup
   * deletes), what they take, and when the newest was indexed
   */
  private async findTitlesOnDisk(
    em: EntityManager,
    mediaType?: MediaType,
  ): Promise<TitleOnDisk[]> {
    const builder = em
      .createQueryBuilder(MediaFile, 'mf')
      .select([
        'mf.mediaType',
        'mf.tmdbId',
        sql`count(*) as files`,
        sql`sum(mf.managed and not exists (
          select 1 from request_binding b where b.media_file_id = mf.id
        )) as unretained`,
        sql`sum(mf.size) as disk_bytes`,
        sql`max(mf.created_at) as added_at`,
      ])
      .groupBy(['mf.mediaType', 'mf.tmdbId']);
    if (mediaType) builder.andWhere({ mediaType });
    const rows = await builder.execute<
      {
        mediaType: MediaType;
        tmdbId: string;
        files: number;
        unretained: number;
        disk_bytes: number;
        added_at: number;
      }[]
    >();

    return rows.map((row) => ({
      mediaType: row.mediaType,
      tmdbId: row.tmdbId,
      files: row.files,
      unretained: row.unretained,
      diskBytes: row.disk_bytes,
      addedAt: row.added_at,
    }));
  }

  /**
   * What a user has of each title, by key: their requests, those with
   * their file, what the files take (as `findUsages` counts them, a file
   * held by several requests once) and when the newest of them was indexed
   */
  private async findHeldTitles(
    em: EntityManager,
    userId: string,
    mediaType?: MediaType,
  ): Promise<Map<string, TitleHeld>> {
    const requests = (
      await this.requestsService.findRequests(em, { userId })
    ).filter(
      (request) => !mediaType || titleTypeOf(request.mediaType) === mediaType,
    );
    if (!requests.length) return new Map();

    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requests.map((request) => request.id) } },
      READ,
    );
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));
    const fileOf = await this.findHeldFiles(em, bindings);

    const byTitle = new Map<
      string,
      { requests: number; bindings: RequestBinding[] }
    >();
    for (const request of requests) {
      const key = titleKey(titleTypeOf(request.mediaType), request.tmdbId);
      const title = byTitle.get(key) ?? { requests: 0, bindings: [] };
      title.requests++;
      const binding = bindingOf.get(request.id);
      if (binding) title.bindings.push(binding);
      byTitle.set(key, title);
    }

    return new Map(
      [...byTitle].map(([key, { requests, bindings }]) => {
        const held = [...filesOf(bindings)].flatMap(
          (id) => fileOf.get(id) ?? [],
        );

        return [
          key,
          {
            requests,
            fulfilled: bindings.filter((b) => b.mediaFileId).length,
            heldBytes: usageOf(bindings, fileOf).heldBytes,
            addedAt: Math.max(
              0,
              ...held.map((file) => file.createdAt.getTime()),
            ),
          },
        ];
      }),
    );
  }
}

/** The direction each sort of the titles reads in when none is asked for */
const NATURAL: Record<TitleUsageSort, OrderDirection> = {
  [TitleUsageSort.Size]: OrderDirection.Desc,
  [TitleUsageSort.Name]: OrderDirection.Asc,
  [TitleUsageSort.Added]: OrderDirection.Desc,
};

function titleKey(mediaType: MediaType, tmdbId: string): string {
  return `${mediaType}:${tmdbId}`;
}
