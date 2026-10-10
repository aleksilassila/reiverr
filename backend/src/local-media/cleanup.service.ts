import { EntityManager } from '@mikro-orm/sqlite';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaType } from '../common/common.dto.js';
import { CLEANUP_HOUR, isCleanupDay } from '../downloads/cleanup.utils.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { HOLDING } from '../requests/request-activity.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { DeletedLibraryEntriesDto } from './local-media.dto.js';
import { LocalMediaService } from './local-media.service.js';
import { MediaFile } from './media-file.entity.js';

const READ = { disableIdentityMap: true };

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
  ) {}

  onModuleInit() {
    // A cleanup that did not run at 04:00 waits for the next one
    this.jobs.define('library.cleanup', {
      dropAtRestart: true,
      run: (payload, { em }) => this.enqueueTitleCleanups(em),
    });
    this.jobs.define('title.cleanup', {
      dropAtRestart: true,
      run: ({ tmdbId }) => this.cleanUpSeries(tmdbId),
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
        await this.jobs.enqueue(tx, 'library.scan', { folder });
      }
      if (isCleanup) await this.jobs.enqueue(tx, 'library.cleanup', {});
    });
  }

  /**
   * Deletes what an admin selected in a library folder, and with it the
   * requests that have the deleted files, which would download them again.
   * The requests are read before anything is deleted, so that a sync that
   * forgets the rows meanwhile does not keep them.
   */
  async deleteLibraryEntries(
    folder: string,
    paths: string[],
    reason: string,
  ): Promise<DeletedLibraryEntriesDto> {
    const files = await this.localMediaService.findLibraryFiles(folder, paths);
    const before = await this.requestsService.findReferringRequests(
      files.map((file) => file.id),
    );

    const { deleted, failed } =
      await this.localMediaService.deleteLibraryEntries(
        folder,
        paths,
        reason,
        async (tx, gone) => {
          const goneIds = gone.map((file) => file.id);
          await this.requestsService.deleteRequests(tx, {
            ids: before
              .filter((request) => goneIds.includes(request.mediaFileId))
              .map((request) => request.id),
            mediaFileIds: goneIds,
          });
        },
      );

    return { deleted, failed };
  }

  private async enqueueTitleCleanups(em: EntityManager): Promise<void> {
    const titles = await this.localMediaService.findTitlesWithManagedFiles(
      MediaType.Series,
    );

    await em.transactional(async (tx) => {
      for (const tmdbId of titles) {
        await this.jobs.enqueue(tx, 'title.cleanup', {
          mediaType: MediaType.Series,
          tmdbId,
        });
      }
    });
  }

  /**
   * Deletes the imported files of a series that no request holds. A file
   * that cannot be deleted is left for the next cleanup.
   */
  private async cleanUpSeries(tmdbId: string): Promise<void> {
    const files = await this.em.find(
      MediaFile,
      { mediaType: MediaType.Series, tmdbId, managed: true },
      READ,
    );
    const held = new Set(
      files.length
        ? (
            await this.em.find(
              MediaRequest,
              {
                mediaFileId: { $in: files.map((file) => file.id) },
                activity: { $in: HOLDING },
              },
              { ...READ, fields: ['mediaFileId'] },
            )
          ).map((request) => request.mediaFileId)
        : [],
    );
    const unheld = files.filter((file) => !held.has(file.id));

    let failed = 0;
    for (const file of unheld) {
      await this.localMediaService
        .deleteManagedFile(file.id, 'no request holds it', (tx) =>
          // A request that referred to it downloads it again when it is active
          this.jobs.enqueue(tx, 'title.reconcile', {
            mediaType: MediaType.Series,
            tmdbId,
          }),
        )
        .catch((error) => {
          // An admin deleted it meanwhile
          if (error instanceof NotFoundException) return;

          failed++;
          this.logger.warn(`Could not delete "${file.path}": ${error.message}`);
        });
    }

    if (failed) {
      throw new Error(`${failed} of ${unheld.length} files were not deleted`);
    }
  }
}
