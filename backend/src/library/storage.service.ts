import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DOWNLOADS_DIR } from '../consts.js';
import { measureDisk } from './disk.utils.js';
import { RequestsService } from '../requests/requests.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { readLibrarySettings } from './library-settings.js';
import {
  DiskUsageDto,
  LibrarySettingsDto,
  StorageDto,
  StorageUsageDto,
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
    const files = await em.find(
      MediaFile,
      { id: { $in: bindings.flatMap((b) => b.mediaFileId ?? []) } },
      { ...READ, fields: ['id', 'size'] },
    );
    const bindingOf = new Map(bindings.map((b) => [b.requestId, b]));
    const sizeOf = new Map(files.map((file) => [file.id, file.size]));

    const usages = new Map<string, Usage>();
    const counted = new Set<string>();
    for (const request of requests) {
      const binding = bindingOf.get(request.id);
      if (!binding) continue;

      const usage = usages.get(request.userId) ?? { ...NO_USAGE };
      usages.set(request.userId, usage);
      usage.pendingBytes += binding.pendingBytes ?? 0;

      const held = `${request.userId}:${binding.mediaFileId}`;
      if (binding.mediaFileId && !counted.has(held)) {
        counted.add(held);
        usage.heldBytes += sizeOf.get(binding.mediaFileId) ?? 0;
      }
    }

    return usages;
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
}
