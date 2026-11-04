import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { DOWNLOADS_DIR } from '../consts.js';
import { measureDisk } from './disk.utils.js';
import type { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { readLibrarySettings } from './library-settings.js';
import { StorageUsageDto } from './library.dto.js';
import { libraryFolderPaths } from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';

const READ = { disableIdentityMap: true };

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
   * Whether bytes more fit the quota of the user of a request, beside what
   * their other requests take, in the caller's entity manager
   */
  async fitsQuota(
    em: EntityManager,
    request: Pick<MediaRequest, 'id' | 'userId'>,
    bytes: number,
  ): Promise<boolean> {
    const quota = await this.usersService.getQuota(em, request.userId);
    if (quota === null) return true;

    const { heldBytes, pendingBytes } = await this.findUsage(
      em,
      request.userId,
      request.id,
    );

    return heldBytes + pendingBytes + bytes <= quota;
  }

  /**
   * Whether a disk the files go to, the download directory or a library
   * folder, is at the limit of the library settings
   */
  async isDiskFull(): Promise<boolean> {
    const settings = await readLibrarySettings(this.settingsService);
    const { maxDiskUsagePercent } = settings;
    if (maxDiskUsagePercent === null) return false;

    const paths = new Set([
      DOWNLOADS_DIR,
      ...libraryFolderPaths(settings.seriesFolders),
      ...libraryFolderPaths(settings.movieFolders),
    ]);
    for (const path of paths) {
      // A path that cannot be measured, as one that is not there, is left out
      const disk = await measureDisk(path);
      if (disk && disk.usedPercent >= maxDiskUsagePercent) return true;
    }

    return false;
  }

  /** The quota of a user and what their requests take */
  async describeUser(userId: string): Promise<StorageUsageDto> {
    const em = this.em.fork();

    return {
      quotaBytes: await this.usersService.getQuota(em, userId),
      ...(await this.findUsage(em, userId)),
    };
  }

  /**
   * What the requests of a user take, leaving out the binding of one
   * request: the files they hold, a file held by several of them once, and
   * what the downloads they wait for are expected to take
   */
  private async findUsage(
    em: EntityManager,
    userId: string,
    except?: string,
  ): Promise<{ heldBytes: number; pendingBytes: number }> {
    const requestIds = (await this.requestsService.findRequests(em, { userId }))
      .map((request) => request.id)
      .filter((id) => id !== except);
    const bindings = await em.find(
      RequestBinding,
      { requestId: { $in: requestIds } },
      READ,
    );
    const files = await em.find(
      MediaFile,
      { id: { $in: bindings.flatMap((b) => b.mediaFileId ?? []) } },
      { ...READ, fields: ['size'] },
    );

    return {
      heldBytes: files.reduce((sum, file) => sum + file.size, 0),
      pendingBytes: bindings.reduce((sum, b) => sum + (b.pendingBytes ?? 0), 0),
    };
  }
}
