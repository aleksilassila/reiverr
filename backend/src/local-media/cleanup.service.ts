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
import { CLEANUP_HOUR, isCleanupDay } from '../downloads/cleanup.utils.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { DeletedLibraryEntriesDto } from './local-media.dto.js';
import { entryExists, LocalMediaService } from './local-media.service.js';
import {
  describeError,
  isInsideFolder,
  relativePath,
} from './local-media.utils.js';
import { MediaFile } from './media-file.entity.js';

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
 * What the library keeps: the cleanup of the imported files that no request
 * holds, and the deletion of files by an admin together with the requests
 * that have them
 */
@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly localMediaService: LocalMediaService,
    private readonly downloadsService: DownloadsService,
    private readonly requestsService: RequestsService,
    private readonly serverLog: ServerLogService,
  ) {}

  onModuleInit() {
    // A cleanup that did not run at 04:00 waits for the next one
    this.jobs.define('localMedia.cleanUpLibrary', {
      dropAtRestart: true,
      run: (payload, { em }) => this.cleanUpLibrary(em),
    });
    this.jobs.define('localMedia.cleanUpTitle', {
      dropAtRestart: true,
      run: (payload) => this.cleanUpTitle(payload),
    });
  }

  /**
   * The nightly jobs: a scan of every library folder, and the cleanup on a
   * cleanup day. Nothing makes the cleanup wait for the scans.
   */
  @Cron(`0 ${CLEANUP_HOUR} * * *`)
  async onCleanupHour(): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.localMediaService.getSettings();
    const { cleanup } = await this.downloadsService.getSettings();
    const isCleanup = isCleanupDay(new Date(), cleanup);

    await this.em.fork().transactional(async (tx) => {
      for (const folder of [...seriesFolders, ...movieFolders]) {
        await this.jobs.enqueue(tx, 'localMedia.scanFolder', { folder });
      }
      if (isCleanup) {
        await this.jobs.enqueue(tx, 'localMedia.cleanUpLibrary', {});
      }
    });
  }

  /**
   * Deletes what an admin selected in a library folder, a directory with
   * everything in it, and forgets the indexed files among them together with
   * the requests that have them, which would download them again. Nothing
   * else is removed: a directory that this leaves empty stays. An entry that
   * cannot be deleted, or only in part, is reported and the others are
   * deleted anyway. Every deletion is logged with the reason.
   */
  async deleteLibraryEntries(
    folder: string,
    paths: string[],
    reason: string,
  ): Promise<DeletedLibraryEntriesDto> {
    const entries = await this.localMediaService.validateLibraryEntries(
      folder,
      paths,
    );
    // Read before anything is deleted, so that a scan that forgets the rows
    // meanwhile does not keep the requests
    const selected: MediaFile[] = [];
    for (const entryPath of entries) {
      selected.push(...(await this.localMediaService.findFilesAt(entryPath)));
    }
    const before = await this.requestsService.findReferringRequests(
      selected.map((file) => file.id),
    );

    const result: DeletedLibraryEntriesDto = { deleted: 0, failed: [] };
    for (const entryPath of entries) {
      const files = await this.localMediaService.findFilesAt(entryPath);
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
        // The rows that a cleanup did not forget meanwhile
        const present = new Set(
          (
            await tx.find(
              MediaFile,
              { id: { $in: goneIds } },
              { fields: ['id'], disableIdentityMap: true },
            )
          ).map((file) => file.id),
        );
        // The requests of every file that is gone, also one whose row a scan
        // forgot while the rm ran
        if (gone.length) {
          await this.requestsService.deleteRequests(tx, {
            ids: before
              .filter((request) => goneIds.includes(request.mediaFileId))
              .map((request) => request.id),
            mediaFileIds: goneIds,
          });
        }
        const forgotten = gone.filter((file) => present.has(file.id));
        if (forgotten.length) {
          await tx.nativeDelete(MediaFile, {
            id: { $in: forgotten.map((file) => file.id) },
          });
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

    return result;
  }

  /**
   * Deletes an imported file from the library, with the folders that it
   * leaves empty, and logs it with the reason. A file that is not what was
   * imported, or that the library folders no longer contain, is kept and
   * becomes an external file.
   */
  async deleteManagedFile(id: string, reason: string): Promise<void> {
    const file = await this.localMediaService.findFile(id);
    if (!file.managed) throw new Error(`"${file.path}" is not managed`);

    const { movieFolders, seriesFolders } =
      await this.localMediaService.getSettings();
    const libraryFolder = [...movieFolders, ...seriesFolders].find((folder) =>
      isInsideFolder(file.path, folder),
    );

    const stats = await fs.stat(file.path).catch(() => undefined);
    if (!stats) {
      // The file is only known to be gone when its folder can be read
      if (libraryFolder) {
        await this.localMediaService.readAvailableLibraryFolder(libraryFolder);
      }
      await this.forgetDeleted(file, `${reason}, it was gone already`);
      return;
    }

    if (!libraryFolder || !isStillImported(file, stats)) {
      this.logger.warn(`"${file.path}" is not as imported, it is kept`);
      await this.em.nativeUpdate(MediaFile, { id }, { managed: false });
      return;
    }

    // An admin can have deleted it meanwhile
    await fs.unlink(file.path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    await this.forgetDeleted(file, reason);

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
  }

  private async cleanUpLibrary(em: EntityManager): Promise<void> {
    const titles = await this.localMediaService.findTitlesWithManagedFiles(
      MediaType.Series,
    );

    await em.transactional(async (tx) => {
      for (const tmdbId of titles) {
        await this.jobs.enqueue(tx, 'localMedia.cleanUpTitle', {
          mediaType: MediaType.Series,
          tmdbId,
        });
      }
    });
  }

  /**
   * Deletes the imported files of a title that no request refers to. A file
   * that cannot be deleted is left for the next cleanup.
   */
  private async cleanUpTitle({
    mediaType,
    tmdbId,
  }: JobPayloads['localMedia.cleanUpTitle']): Promise<void> {
    const files = await this.em.find(
      MediaFile,
      { mediaType, tmdbId, managed: true },
      READ,
    );
    const held = new Set(
      files.length
        ? (
            await this.em.find(
              MediaRequest,
              { mediaFileId: { $in: files.map((file) => file.id) } },
              { ...READ, fields: ['mediaFileId'] },
            )
          ).map((request) => request.mediaFileId)
        : [],
    );
    const unheld = files.filter((file) => !held.has(file.id));

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

    if (failed) {
      throw new Error(`${failed} of ${unheld.length} files were not deleted`);
    }
  }

  /**
   * Forgets the row of a deleted file and logs the deletion. The title is
   * reconciled in the same transaction: a request that referred to the file
   * downloads it again.
   */
  private forgetDeleted(file: MediaFile, reason: string): Promise<void> {
    return this.em.transactional(async (tx) => {
      await this.jobs.enqueue(tx, 'downloads.reconcileTitle', {
        mediaType: file.mediaType,
        tmdbId: file.tmdbId,
      });
      const deleted = await tx.nativeDelete(MediaFile, { id: file.id });
      if (deleted) await this.logDeleted(tx, file.path, reason, file);
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
