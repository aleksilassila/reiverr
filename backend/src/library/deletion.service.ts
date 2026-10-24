import { EntityManager } from '@mikro-orm/sqlite';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobsService } from '../jobs/jobs.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { CLEANUP_HOUR, isCleanupDay } from './cleanup.utils.js';
import { entryExists } from './disk.utils.js';
import { DeleteLibraryEntriesResultDto } from './library.dto.js';
import { LibraryService } from './library.service.js';
import {
  describeError,
  isInsideFolder,
  libraryFolderPaths,
  relativePath,
} from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';

const READ = { disableIdentityMap: true };

/** Whether a file is still the one that was imported, as its row has it */
const isStillImported = (
  file: Pick<MediaFile, 'size' | 'modifiedAt'>,
  stats: { isFile(): boolean; size: number; mtime: Date },
) =>
  stats.isFile() &&
  stats.size === file.size &&
  stats.mtime.getTime() === file.modifiedAt.getTime();

/**
 * What the library deletes: the managed files that no request holds, at
 * the cleanup, and what an admin selects, together with the requests that
 * have the files
 */
@Injectable()
export class DeletionService implements OnModuleInit {
  private readonly logger = new Logger(DeletionService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly libraryService: LibraryService,
    private readonly requestsService: RequestsService,
    private readonly serverLog: ServerLogService,
  ) {}

  onModuleInit() {
    // A cleanup that did not run at 04:00 waits for the next one
    this.jobs.define('library.cleanUpTitle', {
      dropAtRestart: true,
      run: async (payload) => {
        await this.cleanUpTitle(payload);
      },
    });
  }

  /** The nightly cleanup, on a cleanup day. It does not wait for the scans of the same hour. */
  @Cron(`0 ${CLEANUP_HOUR} * * *`)
  async onCleanupHour(): Promise<void> {
    const { cleanup } = await this.libraryService.getSettings();
    if (!isCleanupDay(new Date(), cleanup)) return;

    await this.cleanUpLibrary();
  }

  /**
   * Deletes what an admin selected in a library folder, a directory with
   * everything in it, and forgets the indexed files among them together
   * with the requests that have them, which would download them again.
   * Nothing else is removed: a directory that this leaves empty stays. An
   * entry that cannot be deleted, or only in part, is reported and the
   * others are deleted anyway. Every deletion is logged with the reason.
   */
  async deleteLibraryEntries(
    folder: string,
    paths: string[],
    reason: string,
  ): Promise<DeleteLibraryEntriesResultDto> {
    const entries = await this.libraryService.validateLibraryEntries(
      folder,
      paths,
    );

    const result: DeleteLibraryEntriesResultDto = { deleted: 0, failed: [] };
    for (const entryPath of entries) {
      const files = await this.libraryService.findFilesAt(entryPath);
      // A cleanup can delete files of the entry meanwhile
      const existed = await entryExists(entryPath);
      const error = await fs
        .rm(entryPath, { recursive: true, force: true })
        .then(
          () => undefined,
          (error) => error,
        );

      // What is gone is gone, whether the deletion got through or not
      const gone: MediaFile[] = [];
      for (const file of files) {
        if (!(await entryExists(file.path))) gone.push(file);
      }
      const isEntryGone =
        existed &&
        !gone.some((file) => file.path === entryPath) &&
        !(await entryExists(entryPath));

      await this.em.transactional(async (tx) => {
        const goneIds = gone.map((file) => file.id);
        if (goneIds.length) {
          // The requests that have the files go, so that nothing downloads
          // them again; a reconcile between the rm and here would have
          // bound them again, so they are read now
          const bindings = await tx.find(
            RequestBinding,
            { mediaFileId: { $in: goneIds } },
            { ...READ, fields: ['requestId'] },
          );
          await this.requestsService.deleteRequests(
            tx,
            bindings.map((binding) => binding.requestId),
          );
        }
        // The rows that a cleanup or a scan did not forget meanwhile
        const forgotten = goneIds.length
          ? await tx.find(MediaFile, { id: { $in: goneIds } }, READ)
          : [];
        if (forgotten.length) {
          await tx.nativeDelete(MediaFile, {
            id: { $in: forgotten.map((file) => file.id) },
          });
          await this.libraryService.filesForgotten(tx, forgotten);
        }
        for (const file of forgotten) {
          await this.logDeleted(tx, file.path, reason, file);
        }
        if (isEntryGone) await this.logDeleted(tx, entryPath, reason);
      });

      if (error) {
        result.failed.push({
          path: relativePath(folder, entryPath),
          error: describeError(error),
        });
      } else {
        result.deleted++;
      }
    }

    // The room the entries took is free
    if (result.deleted) {
      await this.jobs.enqueue(this.em, 'library.sweepRequests', {});
    }

    return result;
  }

  /**
   * Deletes a managed file that no request holds from the library, with the
   * folders that it leaves empty, and logs it with the reason. Whether a
   * request holds it is asked in the transaction that forgets the row,
   * before the file is unlinked, so that a file that something came to hold
   * meanwhile is kept. A file that is not what was imported, or that the
   * library folders no longer contain, is kept and becomes an external
   * file.
   */
  async deleteManagedFile(
    id: string,
    reason: string,
  ): Promise<'deleted' | 'kept'> {
    const file = await this.libraryService.findFile(id);
    if (!file.managed) throw new Error(`"${file.path}" is not managed`);

    const { movieFolders, seriesFolders } =
      await this.libraryService.getSettings();
    const libraryFolder = [
      ...libraryFolderPaths(movieFolders),
      ...libraryFolderPaths(seriesFolders),
    ].find((folder) => isInsideFolder(file.path, folder));

    const stats = await fs.stat(file.path).catch(() => undefined);
    if (!stats) {
      // The file is only known to be gone when its folder can be read
      if (libraryFolder) {
        await this.libraryService.readAvailableLibraryFolder(libraryFolder);
      }
      const forgotten = await this.forget(file);
      if (forgotten) {
        await this.em.transactional((tx) =>
          this.logDeleted(
            tx,
            file.path,
            `${reason}, it was gone already`,
            file,
          ),
        );
      }
      return forgotten ? 'deleted' : 'kept';
    }

    if (!libraryFolder || !isStillImported(file, stats)) {
      this.logger.warn(`"${file.path}" is not as imported, it is kept`);
      await this.em.nativeUpdate(MediaFile, { id }, { managed: false });
      return 'kept';
    }

    if (!(await this.forget(file))) return 'kept';

    // An admin can have deleted it meanwhile. A file that cannot be deleted
    // stays without a row, and the next scan finds it as an external file.
    await fs.unlink(file.path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    await this.em.transactional((tx) =>
      this.logDeleted(tx, file.path, reason, file),
    );

    for (
      let folder = path.dirname(file.path);
      isInsideFolder(folder, libraryFolder);
      folder = path.dirname(folder)
    ) {
      // Fails for a folder that still has something in it
      const removed = await fs.rmdir(folder).then(
        () => true,
        () => false,
      );
      if (!removed) break;
    }

    return 'deleted';
  }

  /**
   * The cleanup of every title that has managed files, a job per title, or
   * with dryRun the files those jobs would delete, looked at now
   */
  async cleanUpLibrary(dryRun = false): Promise<MediaFile[]> {
    const titles = (
      await this.libraryService.findTitlesWithManagedFiles(MediaType.Series)
    ).map((tmdbId) => ({ mediaType: MediaType.Series, tmdbId }));

    if (dryRun) {
      const unheld: MediaFile[] = [];
      for (const title of titles) {
        unheld.push(...(await this.cleanUpTitle(title, true)));
      }
      return unheld;
    }

    await this.em.fork().transactional(async (tx) => {
      for (const title of titles) {
        await this.jobs.enqueue(tx, 'library.cleanUpTitle', title);
      }
    });
    return [];
  }

  /**
   * Deletes the managed files of a title that no request holds, or with
   * dryRun only tells which they are. A file that cannot be deleted is left
   * for the next cleanup.
   */
  private async cleanUpTitle(
    { mediaType, tmdbId }: JobPayloads['library.cleanUpTitle'],
    dryRun = false,
  ): Promise<MediaFile[]> {
    const files = await this.em.find(
      MediaFile,
      { mediaType, tmdbId, managed: true },
      READ,
    );
    const held = new Set(
      files.length
        ? (
            await this.em.find(
              RequestBinding,
              { mediaFileId: { $in: files.map((file) => file.id) } },
              { ...READ, fields: ['mediaFileId'] },
            )
          ).map((binding) => binding.mediaFileId)
        : [],
    );
    const unheld = files.filter((file) => !held.has(file.id));
    if (dryRun) return unheld;

    let failed = 0;
    for (const file of unheld) {
      await this.deleteManagedFile(file.id, 'no request holds it').catch(
        (error) => {
          // An admin deleted it meanwhile
          if (error instanceof NotFoundException) return;

          failed++;
          this.logger.warn(`Could not delete "${file.path}": ${error.message}`);
        },
      );
    }

    // The room the files took is free
    if (unheld.length > failed) {
      await this.jobs.enqueue(this.em, 'library.sweepRequests', {});
    }
    if (failed) {
      throw new Error(`${failed} of ${unheld.length} files were not deleted`);
    }
    return unheld;
  }

  /** Forgets the row of a file unless a request holds it, in one transaction */
  private forget(file: MediaFile): Promise<boolean> {
    return this.em.transactional(async (tx) => {
      const held = await tx.count(RequestBinding, { mediaFileId: file.id });
      if (held) return false;

      const deleted = await tx.nativeDelete(MediaFile, {
        id: file.id,
        managed: true,
      });

      return deleted > 0;
    });
  }

  private logDeleted(
    em: EntityManager,
    filePath: string,
    reason: string,
    file?: MediaFile,
  ) {
    return this.serverLog.writeIn(
      em,
      LogType.FileDeleted,
      `Deleted "${filePath}": ${reason}`,
      {
        path: filePath,
        ...(file && {
          size: file.size,
          mediaType: file.mediaType,
          tmdbId: file.tmdbId,
          season: file.season,
          episode: file.episode,
          lastEpisode: file.lastEpisode,
          infoHash: file.infoHash,
        }),
      },
    );
  }
}
